"""YouTube-first music discovery with Audius as a resilient fallback."""
import hashlib
import logging

from fastapi import APIRouter, Cookie, HTTPException, Query, Response
from fastapi.responses import RedirectResponse

from ..auth import get_account
from ..cache import cache
from ..config import settings
from ..services import audius, recommendations as discovery, ytm

router = APIRouter(prefix="/music", tags=["music"])
TRACK_CACHE_TTL = 300
log = logging.getLogger("musify.music")


def _serialize_youtube_tracks(tracks) -> list[dict]:
    return [
        track.model_dump(by_alias=True) if hasattr(track, "model_dump") else track
        for track in tracks
    ]


async def _youtube_search_first(query: str, limit: int) -> dict:
    fallback_reason = "empty"
    fallback_code = None
    try:
        tracks = await ytm.run(ytm.search_music_tracks, query, limit)
        if tracks:
            return {
                "provider": "youtube",
                "tracks": _serialize_youtube_tracks(tracks),
            }
    except HTTPException as exc:
        fallback_reason = "unavailable"
        detail = exc.detail if isinstance(exc.detail, dict) else {}
        fallback_code = detail.get("code")
        log.warning(
            "YouTube search unavailable; falling back to Audius (%s)",
            fallback_code or exc.status_code,
        )

    tracks = await audius.search_tracks(query, limit)
    return {
        "provider": "audius" if tracks else "youtube",
        "tracks": tracks,
        "fallbackReason": fallback_reason,
        "fallbackCode": fallback_code,
    }


async def _youtube_trending_first(limit: int) -> dict:
    fallback_reason = "empty"
    fallback_code = None
    try:
        tracks = await ytm.run(
            ytm.trending_music_tracks,
            settings.youtube_region_code,
            limit,
        )
        if tracks:
            return {
                "provider": "youtube",
                "tracks": _serialize_youtube_tracks(tracks),
            }
    except HTTPException as exc:
        fallback_reason = "unavailable"
        detail = exc.detail if isinstance(exc.detail, dict) else {}
        fallback_code = detail.get("code")
        log.warning(
            "YouTube trending unavailable; falling back to Audius (%s)",
            fallback_code or exc.status_code,
        )

    tracks = await audius.trending_tracks(limit)
    return {
        "provider": "audius" if tracks else "youtube",
        "tracks": tracks,
        "fallbackReason": fallback_reason,
        "fallbackCode": fallback_code,
    }


async def _cached_track(track_id: str) -> dict:
    key = f"audius:track:{track_id}"
    track, _ = await cache.get_or_set(
        key,
        TRACK_CACHE_TTL,
        lambda: audius.get_track(track_id),
    )
    return track


@router.get("/providers")
async def providers():
    """Safe configuration diagnostics; never expose API keys or OAuth secrets."""
    return {
        "priority": "youtube",
        "youtube": {
            "configured": bool(settings.youtube_api_key),
            "regionCode": settings.youtube_region_code.upper(),
        },
        "audius": {
            "configured": True,
            "apiKeyConfigured": bool(settings.audius_api_key),
            "role": "fallback",
        },
    }


@router.get("/search")
async def search(
    response: Response,
    q: str = Query(min_length=1, max_length=100),
    limit: int = Query(default=20, ge=1, le=25),
):
    query = q.strip()
    if not query:
        raise HTTPException(
            422,
            detail={
                "code": "EMPTY_QUERY",
                "message": "Escreve o nome de uma música ou artista.",
            },
        )

    digest = hashlib.sha256(query.casefold().encode()).hexdigest()[:20]
    key = f"music:search:v3:{digest}:{limit}"
    data, hit = await cache.get_or_set(
        key,
        settings.ttl_search,
        lambda: _youtube_search_first(query, limit),
    )
    response.headers["X-Cache"] = "HIT" if hit else "MISS"
    return data


@router.get("/trending")
async def trending(
    response: Response,
    limit: int = Query(default=20, ge=1, le=25),
):
    key = f"music:trending:v3:{settings.youtube_region_code.upper()}:{limit}"
    data, hit = await cache.get_or_set(
        key,
        settings.ttl_home,
        lambda: _youtube_trending_first(limit),
    )
    response.headers["X-Cache"] = "HIT" if hit else "MISS"
    return data


@router.get("/recommendations")
async def recommendations(
    response: Response,
    limit: int = Query(default=20, ge=1, le=25),
    musify_youtube_session: str | None = Cookie(default=None),
):
    account = await get_account(musify_youtube_session)
    if account:
        identity = (
            (account.get("channel") or {}).get("id")
            or musify_youtube_session
            or "connected"
        )
    else:
        identity = "public"
    identity_hash = hashlib.sha256(identity.encode()).hexdigest()[:20]
    key = f"music:recommendations:v1:{identity_hash}:{limit}"

    async def load():
        fallback_reason = "empty"
        fallback_code = None
        personalized = False
        try:
            if account:
                tracks, personalized = await discovery.recommend_from_likes(
                    account["access_token"],
                    limit,
                )
            else:
                tracks = await ytm.run(
                    ytm.trending_music_tracks,
                    settings.youtube_region_code,
                    limit,
                )
            if tracks:
                return {
                    "provider": "youtube",
                    "personalized": personalized,
                    "tracks": _serialize_youtube_tracks(tracks),
                }
        except HTTPException as exc:
            fallback_reason = "unavailable"
            detail = exc.detail if isinstance(exc.detail, dict) else {}
            fallback_code = detail.get("code")
            log.warning(
                "YouTube recommendations unavailable; falling back to Audius (%s)",
                fallback_code or exc.status_code,
            )

        fallback = await audius.trending_tracks(limit)
        return {
            "provider": "audius" if fallback else "youtube",
            "personalized": False,
            "tracks": fallback,
            "fallbackReason": fallback_reason,
            "fallbackCode": fallback_code,
        }

    data, hit = await cache.get_or_set(key, settings.ttl_recommendations, load)
    response.headers["X-Cache"] = "HIT" if hit else "MISS"
    return data


@router.get("/tracks/{track_id}")
async def track(track_id: str):
    if not audius.is_valid_track_id(track_id):
        raise HTTPException(
            422,
            detail={
                "code": "INVALID_TRACK_ID",
                "message": "Identificador de faixa inválido.",
            },
        )
    return await _cached_track(track_id)


@router.get("/tracks/{track_id}/stream", include_in_schema=False)
async def stream(track_id: str):
    if not audius.is_valid_track_id(track_id):
        raise HTTPException(
            422,
            detail={
                "code": "INVALID_TRACK_ID",
                "message": "Identificador de faixa inválido.",
            },
        )

    item = await audius.get_track(track_id)
    if item["isStreamGated"]:
        raise HTTPException(
            403,
            detail={
                "code": "AUDIUS_STREAM_GATED",
                "message": "Esta faixa tem condições especiais de acesso no Audius.",
            },
        )
    if not item["isStreamable"]:
        raise HTTPException(
            403,
            detail={
                "code": "AUDIUS_STREAM_UNAVAILABLE",
                "message": "O Audius não disponibiliza a reprodução desta faixa.",
            },
        )

    return RedirectResponse(audius.stream_url(track_id), status_code=307)
