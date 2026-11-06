"""YouTube-first recommendations based on the signed-in user's liked videos."""
from collections import Counter

import httpx
from fastapi import HTTPException

from ..schemas import Track
from . import ytm

BASE_URL = ytm.BASE_URL


async def get_liked_tracks(access_token: str, limit: int = 30) -> list[Track]:
    """Read the authenticated channel's likes playlist using its OAuth token."""
    headers = {'Authorization': f'Bearer {access_token}'}
    async with httpx.AsyncClient(timeout=15) as client:
        channel_response = await client.get(
            f'{BASE_URL}/channels',
            params={'part': 'contentDetails', 'mine': 'true'},
            headers=headers,
        )
        if channel_response.status_code in (403, 404):
            return []
        try:
            channel_response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail={
                'error': 'upstream',
                'code': 'YOUTUBE_LIKES_UNAVAILABLE',
                'message': 'Não foi possível ler os vídeos de que gostas no YouTube.',
            }) from exc

        channels = channel_response.json().get('items', [])
        if not channels:
            return []
        likes_id = (
            channels[0].get('contentDetails', {})
            .get('relatedPlaylists', {})
            .get('likes')
        )
        if not likes_id:
            return []

        likes_response = await client.get(
            f'{BASE_URL}/playlistItems',
            params={
                'part': 'snippet,contentDetails',
                'playlistId': likes_id,
                'maxResults': min(max(limit, 1), 50),
            },
            headers=headers,
        )
        if likes_response.status_code in (403, 404):
            return []
        try:
            likes_response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail={
                'error': 'upstream',
                'code': 'YOUTUBE_LIKES_UNAVAILABLE',
                'message': 'Não foi possível ler os vídeos de que gostas no YouTube.',
            }) from exc

    items = likes_response.json().get('items', [])
    ids = [
        item.get('contentDetails', {}).get('videoId')
        or item.get('snippet', {}).get('resourceId', {}).get('videoId')
        for item in items
    ]
    ids = list(dict.fromkeys(value for value in ids if value))
    if not ids:
        return []

    videos = await ytm.run(ytm._video_details, ids)
    by_id = {item.get('id'): item for item in videos if item.get('id')}
    tracks: list[Track] = []
    for video_id in ids:
        item = by_id.get(video_id)
        if not item:
            continue
        track = ytm.normalize_track(item)
        if track:
            tracks.append(track)
    return tracks


def _seed_query(seeds: list[Track]) -> str:
    artists = [
        artist.name.strip()
        for track in seeds
        for artist in track.artists
        if artist.name.strip()
    ]
    if artists:
        counts = Counter(artists)
        names = [name for name, _ in counts.most_common(3)]
        return ' '.join(names) + ' similar music'
    if seeds:
        return f'{seeds[0].title} similar songs'
    return 'popular music'


async def recommend_from_likes(access_token: str, limit: int = 20) -> tuple[list[Track], bool]:
    """Return recommendations and whether liked videos actually informed them."""
    limit = min(max(limit, 1), 25)
    seeds = await get_liked_tracks(access_token, 30)
    if not seeds:
        return await ytm.run(ytm.search_music_tracks, 'popular music', limit), False

    liked_ids = {track.videoId for track in seeds}
    candidates = await ytm.run(
        ytm.search_music_tracks,
        _seed_query(seeds),
        min(25, max(limit * 2, 10)),
    )
    recommendations: list[Track] = []
    seen: set[str] = set(liked_ids)
    for track in candidates:
        if track.videoId in seen:
            continue
        seen.add(track.videoId)
        recommendations.append(track)
        if len(recommendations) >= limit:
            break

    if len(recommendations) < min(limit, 5):
        extras = await ytm.run(ytm.search_music_tracks, 'new popular music', limit)
        for track in extras:
            if track.videoId in seen:
                continue
            seen.add(track.videoId)
            recommendations.append(track)
            if len(recommendations) >= limit:
                break
    return recommendations, True
