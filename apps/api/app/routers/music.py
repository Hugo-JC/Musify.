"""Audius discovery and playback endpoints."""
import re
import hashlib
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import RedirectResponse

from ..cache import cache
from ..config import settings
from ..services import audius

router = APIRouter(prefix="/music", tags=["music"])
TRACK_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,100}$")


@router.get("/search")
async def search(response: Response, q: str = Query(min_length=1, max_length=100), limit: int = Query(default=20, ge=1, le=25)):
    query = q.strip()
    if not query:
        raise HTTPException(422, detail={"code": "EMPTY_QUERY", "message": "Escreve o nome de uma música ou artista."})
    digest = hashlib.sha256(query.casefold().encode()).hexdigest()[:20]
    key = f"audius:search:{digest}:{limit}"
    data, hit = await cache.get_or_set(key, settings.ttl_search, lambda: audius.search_tracks(query, limit))
    response.headers["X-Cache"] = "HIT" if hit else "MISS"
    return {"provider": "audius", "tracks": data}


@router.get("/trending")
async def trending(response: Response, limit: int = Query(default=20, ge=1, le=25)):
    key = f"audius:trending:{limit}"
    data, hit = await cache.get_or_set(key, settings.ttl_home, lambda: audius.trending_tracks(limit))
    response.headers["X-Cache"] = "HIT" if hit else "MISS"
    return {"provider": "audius", "tracks": data}


@router.get("/tracks/{track_id}")
async def track(track_id: str):
    if not TRACK_ID_RE.fullmatch(track_id):
        raise HTTPException(422, detail={"code": "INVALID_TRACK_ID", "message": "Identificador de faixa inválido."})
    return await audius.get_track(track_id)


@router.get("/tracks/{track_id}/stream", include_in_schema=False)
async def stream(track_id: str):
    if not TRACK_ID_RE.fullmatch(track_id):
        raise HTTPException(422, detail={"code": "INVALID_TRACK_ID", "message": "Identificador de faixa inválido."})
    item = await audius.get_track(track_id)
    if item["isStreamGated"]:
        raise HTTPException(403, detail={"code": "AUDIUS_STREAM_GATED", "message": "Esta faixa tem condições especiais de acesso no Audius."})
    return RedirectResponse(audius.stream_url(track_id), status_code=307)
