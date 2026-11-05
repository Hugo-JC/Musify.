"""Acesso ao YouTube Music (ytmusicapi) e normalização para os nossos schemas."""
import asyncio
import re
from typing import Any

from ytmusicapi import YTMusic

from ..schemas import Artist, Playlist, PlaylistCard, SearchResults, Track

_ytm: YTMusic | None = None

MOODS: dict[str, str] = {
    'focus': 'focus study concentration music',
    'unwind': 'relax unwind chill music',
    'energy': 'energy workout high energy music',
}


def client() -> YTMusic:
    global _ytm
    if _ytm is None:
        _ytm = YTMusic()
    return _ytm


def pick_thumbnail(thumbs: list[dict[str, Any]] | None, size: int = 544) -> str | None:
    if not thumbs:
        return None
    best = max(thumbs, key=lambda t: (t.get('width') or 0) * (t.get('height') or 0))
    url = best.get('url')
    if not url:
        return None
    if ('googleusercontent.com' in url or 'ggpht.com' in url) and '=w' in url:
        url = re.sub(r'=w\d+-h\d+.*$', f'=w{size}-h{size}-l90-rj', url)
    return url


def normalize_track(t: dict[str, Any], fallback_thumb: str | None = None) -> Track | None:
    video_id = t.get('videoId')
    if not video_id:
        return None
    album = t.get('album')
    album_name = album.get('name') if isinstance(album, dict) else album
    artists = [
        Artist(id=a.get('id'), name=a.get('name') or '')
        for a in (t.get('artists') or [])
        if isinstance(a, dict) and a.get('name')
    ]
    return Track(
        videoId=video_id,
        title=t.get('title') or 'Sem título',
        artists=artists,
        album=album_name,
        durationSeconds=t.get('duration_seconds'),
        thumbnail=pick_thumbnail(t.get('thumbnails') or t.get('thumbnail')) or fallback_thumb,
    )


def _author(p: dict[str, Any]) -> str | None:
    a = p.get('author')
    if isinstance(a, dict):
        return a.get('name')
    if isinstance(a, list) and a:
        return a[0].get('name')
    return a if isinstance(a, str) else None


def normalize_playlist(p: dict[str, Any], pid: str) -> Playlist:
    cover = pick_thumbnail(p.get('thumbnails'))
    tracks = [x for x in (normalize_track(t, cover) for t in p.get('tracks') or []) if x]
    return Playlist(
        id=pid,
        title=p.get('title') or 'Playlist',
        description=p.get('description'),
        author=_author(p),
        thumbnail=cover,
        trackCount=int(p.get('trackCount') or len(tracks)),
        tracks=tracks,
    )


def normalize_album(a: dict[str, Any], browse_id: str) -> Playlist:
    cover = pick_thumbnail(a.get('thumbnails'))
    artists = ', '.join(x.get('name', '') for x in a.get('artists') or [] if x.get('name'))
    tracks = [x for x in (normalize_track(t, cover) for t in a.get('tracks') or []) if x]
    return Playlist(
        id=browse_id,
        title=a.get('title') or 'Álbum',
        description=a.get('description'),
        author=artists or None,
        thumbnail=cover,
        trackCount=int(a.get('trackCount') or len(tracks)),
        tracks=tracks,
    )


def _card_from_search(item: dict[str, Any], kind: str) -> PlaylistCard | None:
    raw_id = item.get('browseId')
    if not raw_id:
        return None
    pid = raw_id[2:] if kind == 'playlist' and raw_id.startswith('VL') else raw_id
    if kind == 'playlist':
        subtitle = item.get('author') if isinstance(item.get('author'), str) else None
        if item.get('itemCount'):
            subtitle = f"{subtitle + ' · ' if subtitle else ''}{item['itemCount']} faixas"
    elif kind == 'album':
        names = ', '.join(a.get('name', '') for a in item.get('artists') or [])
        subtitle = ' · '.join(x for x in (names, item.get('year')) if x) or None
    else:
        subtitle = 'Artista'
    return PlaylistCard(
        id=pid,
        title=item.get('title') or item.get('artist') or '',
        subtitle=subtitle,
        thumbnail=pick_thumbnail(item.get('thumbnails')),
        kind=kind,  # type: ignore[arg-type]
    )


# --- funções síncronas (a biblioteca é bloqueante) ---

def search_playlist_cards(query: str, limit: int = 6) -> list[PlaylistCard]:
    items = client().search(query, filter='playlists', limit=limit) or []
    cards = [_card_from_search(i, 'playlist') for i in items]
    return [c for c in cards if c][:limit]


def get_playlist(pid: str) -> Playlist:
    if pid.startswith('MPRE'):
        return normalize_album(client().get_album(pid), pid)
    return normalize_playlist(client().get_playlist(pid, limit=100), pid)


def search_all(query: str, limit: int = 8) -> SearchResults:
    yt = client()
    songs = [x for x in (normalize_track(i) for i in yt.search(query, filter='songs', limit=limit)) if x]
    playlists = [c for c in (_card_from_search(i, 'playlist') for i in yt.search(query, filter='playlists', limit=limit)) if c]
    albums = [c for c in (_card_from_search(i, 'album') for i in yt.search(query, filter='albums', limit=limit)) if c]
    artists = [c for c in (_card_from_search(i, 'artist') for i in yt.search(query, filter='artists', limit=limit)) if c]
    return SearchResults(songs=songs, playlists=playlists, albums=albums, artists=artists)


async def run(fn, *args):
    return await asyncio.to_thread(fn, *args)
