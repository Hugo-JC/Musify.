"""Official YouTube Data API v3 client and response normalization."""
import re
from typing import Any

import httpx
from fastapi import HTTPException

from ..config import settings
from ..schemas import Artist, Playlist, PlaylistCard, SearchResults, Track

BASE_URL = 'https://www.googleapis.com/youtube/v3'
MOODS: dict[str, str] = {
    'focus': 'focus study concentration music',
    'unwind': 'relax unwind chill music',
    'energy': 'energy workout high energy music',
}


def _request(resource: str, params: dict[str, Any]) -> dict[str, Any]:
    if not settings.youtube_api_key:
        raise HTTPException(status_code=503, detail={
            'error': 'configuration', 'code': 'YOUTUBE_API_KEY_MISSING',
            'message': 'A API oficial do YouTube não está configurada. Defina YOUTUBE_API_KEY no ambiente da API.'
        })
    try:
        response = httpx.get(f'{BASE_URL}/{resource}', params={**params, 'key': settings.youtube_api_key}, timeout=15)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail={'error': 'upstream', 'code': 'YOUTUBE_UNAVAILABLE', 'message': str(exc)[:200]}) from exc
    if response.is_error:
        try:
            payload = response.json().get('error', {})
            message = payload.get('message') or response.reason_phrase
            reason = (payload.get('errors') or [{}])[0].get('reason', 'YOUTUBE_API_ERROR')
        except (ValueError, AttributeError):
            message, reason = response.reason_phrase, 'YOUTUBE_API_ERROR'
        raise HTTPException(status_code=502, detail={'error': 'upstream', 'code': reason, 'message': str(message)[:200]})
    return response.json()


def pick_thumbnail(thumbs: dict[str, Any] | list[dict[str, Any]] | None, size: int = 544) -> str | None:
    if not thumbs:
        return None
    values = list(thumbs.values()) if isinstance(thumbs, dict) else thumbs
    best = max(values, key=lambda t: (t.get('width') or 0) * (t.get('height') or 0))
    return best.get('url')


def _duration(value: str | None) -> int | None:
    if not value:
        return None
    match = re.fullmatch(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', value)
    if not match:
        return None
    hours, minutes, seconds = (int(x or 0) for x in match.groups())
    return hours * 3600 + minutes * 60 + seconds


def normalize_track(item: dict[str, Any], fallback_thumb: str | None = None) -> Track | None:
    # Accept both normalized video resources and search.list results.
    video_id = item.get('videoId') or item.get('id')
    if isinstance(video_id, dict):
        video_id = video_id.get('videoId')
    snippet = item.get('snippet') or item
    if not video_id:
        return None
    channel = snippet.get('channelTitle') or ''
    return Track(
        videoId=video_id,
        title=snippet.get('title') or 'Sem título',
        artists=[Artist(name=channel)] if channel else [],
        album=None,
        durationSeconds=item.get('durationSeconds') or _duration((item.get('contentDetails') or {}).get('duration')),
        thumbnail=pick_thumbnail(snippet.get('thumbnails')) or fallback_thumb,
    )


def _playlist_card(item: dict[str, Any], kind: str = 'playlist') -> PlaylistCard | None:
    snippet = item.get('snippet') or {}
    raw_id = item.get('id')
    if isinstance(raw_id, dict):
        raw_id = raw_id.get('playlistId') or raw_id.get('channelId')
    if not raw_id:
        return None
    return PlaylistCard(
        id=raw_id, title=snippet.get('title') or 'Sem título',
        subtitle=snippet.get('channelTitle') or ('Canal' if kind == 'artist' else None),
        thumbnail=pick_thumbnail(snippet.get('thumbnails')), kind=kind,
    )


def search_playlist_cards(query: str, limit: int = 6) -> list[PlaylistCard]:
    data = _request('search', {'part': 'snippet', 'type': 'playlist', 'q': query, 'maxResults': min(limit, 50)})
    return [card for card in (_playlist_card(item) for item in data.get('items', [])) if card]


def get_playlist(playlist_id: str) -> Playlist:
    details = _request('playlists', {'part': 'snippet,contentDetails', 'id': playlist_id}).get('items', [])
    if not details:
        raise HTTPException(status_code=404, detail={'error': 'not_found', 'code': 'PLAYLIST_NOT_FOUND', 'message': 'A playlist não foi encontrada ou não é pública.'})
    item = details[0]
    snippet = item.get('snippet') or {}
    listed = _request('playlistItems', {'part': 'snippet,contentDetails', 'playlistId': playlist_id, 'maxResults': 50}).get('items', [])
    ids = [x.get('contentDetails', {}).get('videoId') for x in listed]
    ids = [x for x in ids if x]
    videos = _request('videos', {'part': 'snippet,contentDetails', 'id': ','.join(ids)}).get('items', []) if ids else []
    tracks = [t for t in (normalize_track(video) for video in videos) if t]
    return Playlist(
        id=playlist_id, title=snippet.get('title') or 'Playlist', description=snippet.get('description'),
        author=snippet.get('channelTitle'), thumbnail=pick_thumbnail(snippet.get('thumbnails')),
        trackCount=(item.get('contentDetails') or {}).get('itemCount') or len(tracks), tracks=tracks,
    )


def search_all(query: str, limit: int = 8) -> SearchResults:
    videos = _request('search', {'part': 'snippet', 'type': 'video', 'videoCategoryId': '10', 'q': query, 'maxResults': min(limit, 50)}).get('items', [])
    playlists = _request('search', {'part': 'snippet', 'type': 'playlist', 'q': query, 'maxResults': min(limit, 50)}).get('items', [])
    channels = _request('search', {'part': 'snippet', 'type': 'channel', 'q': query, 'maxResults': min(limit, 50)}).get('items', [])
    ids = [x.get('id', {}).get('videoId') for x in videos if x.get('id', {}).get('videoId')]
    details = _request('videos', {'part': 'snippet,contentDetails', 'id': ','.join(ids)}).get('items', []) if ids else []
    return SearchResults(
        songs=[t for t in (normalize_track(i) for i in details) if t],
        playlists=[c for c in (_playlist_card(i) for i in playlists) if c],
        albums=[],
        artists=[c for c in (_playlist_card(i, 'artist') for i in channels) if c],
    )


async def run(fn, *args):
    import asyncio
    return await asyncio.to_thread(fn, *args)
