"""Audius read-only catalog and playback adapter.

Only catalog metadata is cached. Audio is always delivered by Audius itself:
Musify does not download, extract, proxy, or re-host audio files.
"""
from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from ..config import settings

BASE_URL = "https://api.audius.co/v1"
TIMEOUT = httpx.Timeout(12.0, connect=4.0)
TRACK_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,100}$")


def is_valid_track_id(track_id: str) -> bool:
    return bool(TRACK_ID_RE.fullmatch(track_id))


def _headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    if settings.audius_api_key:
        headers["X-API-Key"] = settings.audius_api_key
    return headers


async def _get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
            response = await client.get(
                f"{BASE_URL}{path}", params=params or {}, headers=_headers()
            )

        if response.status_code == 404:
            raise HTTPException(
                404,
                detail={
                    "code": "AUDIUS_NOT_FOUND",
                    "message": "Conteúdo não encontrado.",
                },
            )
        if response.is_redirect:
            raise HTTPException(
                502,
                detail={
                    "code": "AUDIUS_UNEXPECTED_REDIRECT",
                    "message": "O catálogo Audius devolveu uma resposta inesperada.",
                },
            )

        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise ValueError("Resposta inválida do fornecedor")
        return payload

    except HTTPException:
        raise
    except httpx.TimeoutException as exc:
        raise HTTPException(
            504,
            detail={
                "code": "AUDIUS_TIMEOUT",
                "message": "O catálogo Audius demorou demasiado a responder.",
            },
        ) from exc
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        code = "AUDIUS_RATE_LIMITED" if status == 429 else "AUDIUS_UNAVAILABLE"
        http_status = 503 if status == 429 or status >= 500 else 502
        raise HTTPException(
            http_status,
            detail={
                "code": code,
                "message": "O catálogo Audius está temporariamente indisponível.",
            },
        ) from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            502,
            detail={
                "code": "AUDIUS_INVALID_RESPONSE",
                "message": "Não foi possível interpretar a resposta do catálogo Audius.",
            },
        ) from exc


def normalize_track(item: dict[str, Any]) -> dict[str, Any] | None:
    track_id = item.get("id")
    if (
        track_id is None
        or item.get("is_available") is False
        or item.get("is_delete") is True
    ):
        return None

    track_id = str(track_id)
    if not is_valid_track_id(track_id):
        return None

    user = item.get("user") or {}
    artwork = item.get("artwork") or item.get("cover_art") or {}
    if isinstance(artwork, dict):
        artwork_url = (
            artwork.get("480x480")
            or artwork.get("1000x1000")
            or artwork.get("150x150")
        )
    else:
        artwork_url = artwork if isinstance(artwork, str) else None

    duration = item.get("duration")
    try:
        duration_seconds = max(0, int(duration)) if duration is not None else None
    except (TypeError, ValueError, OverflowError):
        duration_seconds = None

    is_stream_gated = bool(item.get("is_stream_gated")) or bool(
        item.get("stream_conditions")
    )

    return {
        "id": track_id,
        "source": "audius",
        "title": item.get("title") or "Sem título",
        "artist": user.get("name") or "Artista desconhecido",
        "artistId": str(user.get("id")) if user.get("id") is not None else None,
        "durationSeconds": duration_seconds,
        "artwork": artwork_url,
        "permalink": item.get("permalink"),
        "streamUrl": f"/api/music/tracks/{track_id}/stream",
        "license": item.get("license"),
        "isStreamable": bool(item.get("is_streamable", False)),
        "isStreamGated": is_stream_gated,
    }


def _normalize_collection(payload: dict[str, Any]) -> list[dict[str, Any]]:
    data = payload.get("data", [])
    if not isinstance(data, list):
        return []
    return [
        track
        for track in (normalize_track(item) for item in data if isinstance(item, dict))
        if track
    ]


async def search_tracks(query: str, limit: int = 20) -> list[dict[str, Any]]:
    payload = await _get(
        "/tracks/search",
        {"query": query, "limit": min(max(limit, 1), 25)},
    )
    return _normalize_collection(payload)


async def trending_tracks(limit: int = 20) -> list[dict[str, Any]]:
    payload = await _get(
        "/tracks/trending",
        {"limit": min(max(limit, 1), 25)},
    )
    return _normalize_collection(payload)


async def get_track(track_id: str) -> dict[str, Any]:
    if not is_valid_track_id(track_id):
        raise HTTPException(
            422,
            detail={
                "code": "INVALID_TRACK_ID",
                "message": "Identificador de faixa inválido.",
            },
        )

    payload = await _get(f"/tracks/{track_id}")
    data = payload.get("data")
    if isinstance(data, list):
        data = data[0] if data else None
    if not isinstance(data, dict):
        raise HTTPException(
            404,
            detail={
                "code": "AUDIUS_NOT_FOUND",
                "message": "Faixa não encontrada.",
            },
        )

    track = normalize_track(data)
    if not track:
        raise HTTPException(
            404,
            detail={
                "code": "AUDIUS_UNAVAILABLE_TRACK",
                "message": "Esta faixa já não está disponível.",
            },
        )
    return track


def stream_url(track_id: str) -> str:
    if not is_valid_track_id(track_id):
        raise HTTPException(
            422,
            detail={
                "code": "INVALID_TRACK_ID",
                "message": "Identificador de faixa inválido.",
            },
        )
    query = urlencode({"app_name": "Musify"})
    return f"{BASE_URL}/tracks/{track_id}/stream?{query}"
