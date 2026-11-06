"""Audius read-only catalog and playback adapter.

This adapter only exposes Audius tracks that the provider marks as available.
It does not download, extract, re-host, or proxy audio files.
"""
from typing import Any
import httpx
from fastapi import HTTPException

from ..config import settings

BASE_URL = "https://api.audius.co/v1"
TIMEOUT = httpx.Timeout(12.0, connect=4.0)


def _headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    if settings.audius_api_key:
        headers["X-API-Key"] = settings.audius_api_key
    return headers


async def _get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
            response = await client.get(f"{BASE_URL}{path}", params=params or {}, headers=_headers())
        if response.status_code == 404:
            raise HTTPException(404, detail={"code": "AUDIUS_NOT_FOUND", "message": "Conteúdo não encontrado."})
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise ValueError("Resposta inválida do fornecedor")
        return payload
    except HTTPException:
        raise
    except httpx.TimeoutException as exc:
        raise HTTPException(504, detail={"code": "AUDIUS_TIMEOUT", "message": "O catálogo Audius demorou demasiado a responder."}) from exc
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        code = "AUDIUS_RATE_LIMITED" if status == 429 else "AUDIUS_UNAVAILABLE"
        http_status = 503 if status == 429 or status >= 500 else 502
        raise HTTPException(http_status, detail={"code": code, "message": "O catálogo Audius está temporariamente indisponível."}) from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(502, detail={"code": "AUDIUS_INVALID_RESPONSE", "message": "Não foi possível interpretar a resposta do catálogo Audius."}) from exc


def normalize_track(item: dict[str, Any]) -> dict[str, Any] | None:
    track_id = item.get("id")
    if track_id is None or item.get("is_available") is False or item.get("is_delete") is True:
        return None
    user = item.get("user") or {}
    artwork = item.get("artwork") or item.get("cover_art") or {}
    if isinstance(artwork, dict):
        artwork_url = artwork.get("480x480") or artwork.get("1000x1000") or artwork.get("150x150")
    else:
        artwork_url = artwork if isinstance(artwork, str) else None
    duration = item.get("duration")
    return {
        "id": str(track_id),
        "source": "audius",
        "title": item.get("title") or "Sem título",
        "artist": user.get("name") or "Artista desconhecido",
        "artistId": str(user.get("id")) if user.get("id") is not None else None,
        "durationSeconds": int(duration) if isinstance(duration, (int, float)) else None,
        "artwork": artwork_url,
        "permalink": item.get("permalink"),
        "streamUrl": f"/api/music/tracks/{track_id}/stream",
        "license": item.get("license"),
        "isStreamGated": bool(item.get("is_stream_gated", False)),
    }


async def search_tracks(query: str, limit: int = 20) -> list[dict[str, Any]]:
    payload = await _get("/tracks/search", {"query": query, "limit": min(max(limit, 1), 25)})
    data = payload.get("data", [])
    if not isinstance(data, list):
        return []
    return [track for track in (normalize_track(item) for item in data if isinstance(item, dict)) if track]


async def trending_tracks(limit: int = 20) -> list[dict[str, Any]]:
    payload = await _get("/tracks/trending", {"limit": min(max(limit, 1), 25)})
    data = payload.get("data", [])
    if not isinstance(data, list):
        return []
    return [track for track in (normalize_track(item) for item in data if isinstance(item, dict)) if track]


async def get_track(track_id: str) -> dict[str, Any]:
    payload = await _get(f"/tracks/{track_id}")
    data = payload.get("data")
    if isinstance(data, list):
        data = data[0] if data else None
    if not isinstance(data, dict):
        raise HTTPException(404, detail={"code": "AUDIUS_NOT_FOUND", "message": "Faixa não encontrada."})
    track = normalize_track(data)
    if not track:
        raise HTTPException(404, detail={"code": "AUDIUS_UNAVAILABLE_TRACK", "message": "Esta faixa não está disponível para reprodução."})
    return track


def stream_url(track_id: str) -> str:
    # Redirect to Audius' own stream endpoint; audio is never stored by Musify.
    return f"{BASE_URL}/tracks/{track_id}/stream"
