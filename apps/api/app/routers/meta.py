import hashlib

from fastapi import APIRouter, HTTPException, Query, Response

from ..cache import cache
from ..config import settings
from ..schemas import HomeResponse, Playlist, PlaylistCard, SearchResults
from ..services import ytm

router = APIRouter()

QUICK_QUERY = 'top hits mix'
MADE_FOR_YOU_QUERIES = ['daily mix', 'new music mix', 'chill hits']


async def _guard(coro):
    try:
        return await coro
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail={'error': 'upstream', 'code': 'YTM_FAILED', 'message': str(exc)[:200]})


@router.get('/home', response_model=HomeResponse)
async def home(response: Response):
    async def load():
        quick = await ytm.run(ytm.search_playlist_cards, QUICK_QUERY, 6)
        made: list[PlaylistCard] = []
        for q in MADE_FOR_YOU_QUERIES:
            cards = await ytm.run(ytm.search_playlist_cards, q, 1)
            made.extend(cards[:1])
        return HomeResponse(quick=quick, madeForYou=made).model_dump()

    data, hit = await _guard(cache.get_or_set('meta:home', settings.ttl_home, load))
    response.headers['X-Cache'] = 'HIT' if hit else 'MISS'
    return data


@router.get('/moods')
async def moods():
    return [{'key': k, 'label': k.capitalize()} for k in ytm.MOODS]


@router.get('/moods/{key}', response_model=list[PlaylistCard])
async def mood(key: str, response: Response):
    query = ytm.MOODS.get(key.lower())
    if not query:
        raise HTTPException(404, detail={'error': 'not_found', 'code': 'UNKNOWN_MOOD'})

    async def load():
        cards = await ytm.run(ytm.search_playlist_cards, query, 6)
        return [c.model_dump() for c in cards]

    data, hit = await _guard(cache.get_or_set(f'meta:mood:{key.lower()}', settings.ttl_moods, load))
    response.headers['X-Cache'] = 'HIT' if hit else 'MISS'
    return data


@router.get('/playlist/{playlist_id}', response_model=Playlist)
async def playlist(playlist_id: str, response: Response):
    if not playlist_id.replace('-', '').replace('_', '').isalnum() or len(playlist_id) > 80:
        raise HTTPException(422, detail={'error': 'invalid_id', 'code': 'BAD_PLAYLIST_ID'})

    async def load():
        return (await ytm.run(ytm.get_playlist, playlist_id)).model_dump()

    data, hit = await _guard(cache.get_or_set(f'meta:playlist:{playlist_id}', settings.ttl_playlist, load))
    response.headers['X-Cache'] = 'HIT' if hit else 'MISS'
    return data


@router.get('/search', response_model=SearchResults)
async def search(response: Response, q: str = Query(min_length=1, max_length=100)):
    digest = hashlib.sha1(q.strip().lower().encode()).hexdigest()[:16]

    async def load():
        return (await ytm.run(ytm.search_all, q.strip())).model_dump()

    data, hit = await _guard(cache.get_or_set(f'meta:search:{digest}', settings.ttl_search, load))
    response.headers['X-Cache'] = 'HIT' if hit else 'MISS'
    return data
