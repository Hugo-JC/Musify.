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
            'message': 'A API oficial do YouTube não está configurada. Define YOUTUBE_API_KEY no ambiente da API.'
        })
    try:
        response = httpx.get(
            f'{BASE_URL}/{resource}',
            params={**params, 'key': settings.youtube_api_key},
            timeout=15,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail={
            'error': 'upstream', 'code': 'YOUTUBE_UNAVAILABLE',
            'message': 'Não foi possível contactar a API do YouTube.'
        }) from exc
    if response.is_error:
        try:
            payload = response.json().get('error', {})
            message = payload.get('message') or response.reason_phrase
            reason = (payload.get('errors') or [{}])[0].get('reason', 'YOUTUBE_API_ERROR')
        except (ValueError, AttributeError):
            message, reason = response.reason_phrase, 'YOUTUBE_API_ERROR'
        raise HTTPException(status_code=502, detail={
            'error': 'upstream', 'code': reason, 'message': str(message)[:200]
        })
    return response.json()


def pick_thumbnail(
    thumbs: dict[str, Any] | list[dict[str, Any]] | None,
    size: int = 544,
) -> str | None:
    if not thumbs:
        return None
    values = list(thumbs.values()) if isinstance(thumbs, dict) else thumbs
    values = [item for item in values if isinstance(item, dict) and item.get('url')]
    if not values:
        return None
    best = max(values, key=lambda item: (item.get('width') or 0) * (item.get('height') or 0))
    return best.get('url')


def _duration(value: str | None) -> int | None:
    if not value:
        return None
    match = re.fullmatch(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', value)
    if not match:
        return None
    hours, minutes, seconds = (int(value or 0) for value in match.groups())
    return hours * 3600 + minutes * 60 + seconds


def normalize_track(item: dict[str, Any], fallback_thumb: str | None = None) -> Track | None:
    """Normalize a videos.list resource or search.list result."""
    video_id = item.get('videoId') or item.get('id')
    if isinstance(video_id, dict):
        video_id = video_id.get('videoId')
    snippet = item.get('snippet') or item
    if not video_id:
        return None
    channel = snippet.get('channelTitle') or ''
    channel_id = snippet.get('channelId')
    return Track(
        videoId=str(video_id),
        source='youtube',
        title=snippet.get('title') or 'Sem título',
        artists=[Artist(id=str(channel_id) if channel_id else None, name=channel)] if channel else [],
        album=None,
        durationSeconds=item.get('durationSeconds') or _duration(
            (item.get('contentDetails') or {}).get('duration')
        ),
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
        id=raw_id,
        title=snippet.get('title') or 'Sem título',
        subtitle=snippet.get('channelTitle') or ('Canal' if kind == 'artist' else None),
        thumbnail=pick_thumbnail(snippet.get('thumbnails')),
        kind=kind,
    )


def _video_details(ids: list[str]) -> list[dict[str, Any]]:
    if not ids:
        return []
    return _request(
        'videos',
        {'part': 'snippet,contentDetails,status', 'id': ','.join(ids[:50])},
    ).get('items', [])


def search_music_tracks(query: str, limit: int = 20) -> list[Track]:
    """Search embeddable videos without assuming creators tagged them as Music."""
    query = query.strip()
    if not query:
        return []
    limit = min(max(limit, 1), 25)
    results = _request('search', {
        'part': 'snippet',
        'type': 'video',
        # Do not force videoCategoryId=10: official music videos are often
        # categorized as Entertainment or People & Blogs by their publishers.
        'videoEmbeddable': 'true',
        'safeSearch': 'moderate',
        'q': query,
        'maxResults': limit,
    }).get('items', [])
    ids = [
        item.get('id', {}).get('videoId')
        for item in results
        if isinstance(item.get('id'), dict) and item['id'].get('videoId')
    ]
    details = _video_details(ids)
    by_id = {item.get('id'): item for item in details if item.get('id')}
    tracks: list[Track] = []
    for video_id in ids:
        item = by_id.get(video_id)
        if not item:
            continue
        status = item.get('status') or {}
        if status.get('privacyStatus') == 'private' or status.get('embeddable') is False:
            continue
        track = normalize_track(item)
        if track:
            tracks.append(track)
    return tracks[:limit]


def trending_music_tracks(region_code: str = 'AO', limit: int = 20) -> list[Track]:
    """Use YouTube most-popular music-category videos for a regional discovery shelf."""
    limit = min(max(limit, 1), 25)
    items = _request('videos', {
        'part': 'snippet,contentDetails,status',
        'chart': 'mostPopular',
        'regionCode': (region_code or 'AO').upper(),
        'videoCategoryId': '10',
        'maxResults': limit,
    }).get('items', [])
    tracks: list[Track] = []
    for item in items:
        status = item.get('status') or {}
        if status.get('privacyStatus') == 'private' or status.get('embeddable') is False:
            continue
        track = normalize_track(item)
        if track:
            tracks.append(track)
    return tracks[:limit]


def search_playlist_cards(query: str, limit: int = 6) -> list[PlaylistCard]:
    data = _request('search', {
        'part': 'snippet', 'type': 'playlist', 'q': query,
        'maxResults': min(limit, 50),
    })
    return [card for card in (_playlist_card(item) for item in data.get('items', [])) if card]


def get_playlist(playlist_id: str) -> Playlist:
    details = _request(
        'playlists',
        {'part': 'snippet,contentDetails', 'id': playlist_id},
    ).get('items', [])
    if not details:
        raise HTTPException(status_code=404, detail={
            'error': 'not_found', 'code': 'PLAYLIST_NOT_FOUND',
            'message': 'A playlist não foi encontrada ou não é pública.'
        })
    item = details[0]
    snippet = item.get('snippet') or {}
    listed = _request('playlistItems', {
        'part': 'snippet,contentDetails',
        'playlistId': playlist_id,
        'maxResults': 50,
    }).get('items', [])
    ids = [
        entry.get('contentDetails', {}).get('videoId')
        or entry.get('snippet', {}).get('resourceId', {}).get('videoId')
        for entry in listed
    ]
    ids = [value for value in ids if value]
    videos = _video_details(ids)
    tracks = [track for track in (normalize_track(video) for video in videos) if track]
    return Playlist(
        id=playlist_id,
        title=snippet.get('title') or 'Playlist',
        description=snippet.get('description'),
        author=snippet.get('channelTitle'),
        thumbnail=pick_thumbnail(snippet.get('thumbnails')),
        trackCount=(item.get('contentDetails') or {}).get('itemCount') or len(tracks),
        tracks=tracks,
    )


def search_all(query: str, limit: int = 8) -> SearchResults:
    videos = _request('search', {
        'part': 'snippet',
        'type': 'video',
        'videoEmbeddable': 'true',
        'q': query,
        'maxResults': min(limit, 50),
    }).get('items', [])
    playlists = _request('search', {
        'part': 'snippet', 'type': 'playlist', 'q': query,
        'maxResults': min(limit, 50),
    }).get('items', [])
    channels = _request('search', {
        'part': 'snippet', 'type': 'channel', 'q': query,
        'maxResults': min(limit, 50),
    }).get('items', [])
    ids = [
        item.get('id', {}).get('videoId')
        for item in videos
        if item.get('id', {}).get('videoId')
    ]
    details = _video_details(ids)
    return SearchResults(
        songs=[track for track in (normalize_track(item) for item in details) if track],
        playlists=[card for card in (_playlist_card(item) for item in playlists) if card],
        albums=[],
        artists=[card for card in (_playlist_card(item, 'artist') for item in channels) if card],
    )


async def run(fn, *args):
    import asyncio
    return await asyncio.to_thread(fn, *args)
