import hashlib
import time

import httpx
from fastapi import APIRouter, Cookie, HTTPException, Query, Response

from ..auth import get_account
from ..cache import cache
from ..config import settings
from ..schemas import HomeResponse, Playlist, PlaylistCard, SearchResults
from ..services import ytm

router = APIRouter()
QUICK_QUERY = 'popular music hits'
MADE_FOR_YOU_QUERIES = ['popular music hits', 'new music 2026', 'chill music mix']


async def _guard(coro):
    try:
        return await coro
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail={'error': 'upstream', 'code': 'YOUTUBE_API_FAILED', 'message': str(exc)[:200]}) from exc


@router.get('/home', response_model=HomeResponse)
async def home(response: Response, musify_youtube_session: str | None = Cookie(default=None)):
    account = await get_account(musify_youtube_session)

    async def load():
        if account:
            async with httpx.AsyncClient(timeout=15) as client:
                token = account['access_token']
                channel = await client.get('https://www.googleapis.com/youtube/v3/channels', params={'part': 'contentDetails', 'mine': 'true'}, headers={'Authorization': f'Bearer {token}'})
                channel.raise_for_status()
                related = channel.json().get('items', [])
                history: list[PlaylistCard] = []
                if related:
                    likes = related[0].get('contentDetails', {}).get('relatedPlaylists', {}).get('likes')
                    if likes:
                        items = await client.get('https://www.googleapis.com/youtube/v3/playlistItems', params={'part': 'snippet', 'playlistId': likes, 'maxResults': 6}, headers={'Authorization': f'Bearer {token}'})
                        items.raise_for_status()
                        ids = [item.get('snippet', {}).get('resourceId', {}).get('videoId') for item in items.json().get('items', [])]
                        ids = [v for v in ids if v]
                        if ids:
                            videos = await client.get('https://www.googleapis.com/youtube/v3/videos', params={'part': 'snippet', 'id': ','.join(ids)}, headers={'Authorization': f'Bearer {token}'})
                            videos.raise_for_status()
                            history = [card for card in (ytm._playlist_card({'id': {'playlistId': v['id']}, 'snippet': v.get('snippet', {})}) for v in videos.json().get('items', [])) if card]
            return HomeResponse(quick=history, madeForYou=history).model_dump()
        quick = await ytm.run(ytm.search_playlist_cards, QUICK_QUERY, 6)
        made: list[PlaylistCard] = []
        for query in MADE_FOR_YOU_QUERIES:
            cards = await ytm.run(ytm.search_playlist_cards, query, 1)
            made.extend(cards[:1])
        return HomeResponse(quick=quick, madeForYou=made).model_dump()

    key = 'meta:home:account' if account else 'meta:home:public'
    data, hit = await _guard(cache.get_or_set(key, settings.ttl_home, load))
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
        return [c.model_dump() for c in await ytm.run(ytm.search_playlist_cards, query, 6)]
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
