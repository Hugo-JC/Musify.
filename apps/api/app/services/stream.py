"""Extração do URL direto de áudio com yt-dlp + cache."""
import asyncio
import re
import time
from dataclasses import asdict, dataclass
from urllib.parse import parse_qs, urlparse

from yt_dlp import YoutubeDL

from ..cache import cache
from ..config import settings

VIDEO_ID_RE = re.compile(r'^[A-Za-z0-9_-]{11}$')
MIME = {'m4a': 'audio/mp4', 'mp4': 'audio/mp4', 'webm': 'audio/webm', 'opus': 'audio/ogg'}

_sem = asyncio.Semaphore(settings.ytdlp_max_concurrency)


class StreamError(Exception):
    def __init__(self, message: str, status: int = 502) -> None:
        super().__init__(message)
        self.status = status


@dataclass
class StreamInfo:
    url: str
    ext: str
    mime: str
    expires_at: int
    headers: dict[str, str]


def is_valid_video_id(video_id: str) -> bool:
    return bool(VIDEO_ID_RE.match(video_id))


def parse_expiry(url: str, default_ttl: int = 3600) -> int:
    """O URL do googlevideo traz o parâmetro `expire` (epoch em segundos)."""
    try:
        value = parse_qs(urlparse(url).query).get('expire', [None])[0]
        if value:
            return int(value)
    except (ValueError, TypeError):
        pass
    return int(time.time()) + default_ttl


def cache_ttl(expires_at: int, now: int | None = None) -> int:
    """TTL conservador: expiração menos 2 minutos, limitado a [0, 5 h]."""
    now = int(time.time()) if now is None else now
    return max(0, min(expires_at - now - 120, 5 * 3600))


def _extract(video_id: str) -> StreamInfo:
    opts = {
        'format': 'bestaudio[ext=m4a]/bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'skip_download': True,
        'socket_timeout': 15,
    }
    with YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=False)
    url = info.get('url')
    if not url:
        raise StreamError('Sem URL de áudio disponível', 404)
    ext = info.get('ext') or 'm4a'
    headers = {k: v for k, v in (info.get('http_headers') or {}).items() if k.lower() == 'user-agent'}
    return StreamInfo(url=url, ext=ext, mime=MIME.get(ext, 'audio/mp4'), expires_at=parse_expiry(url), headers=headers)


async def get_stream_info(video_id: str, force: bool = False) -> StreamInfo:
    key = f'stream:{video_id}'
    if not force:
        hit = await cache.get(key)
        if hit:
            return StreamInfo(**hit)
    async with cache.lock(f'extract:{video_id}'):
        if not force:
            hit = await cache.get(key)
            if hit:
                return StreamInfo(**hit)
        async with _sem:
            try:
                info = await asyncio.wait_for(
                    asyncio.to_thread(_extract, video_id), timeout=settings.ytdlp_timeout_seconds
                )
            except asyncio.TimeoutError as exc:
                raise StreamError('Tempo limite na extração do áudio', 504) from exc
            except StreamError:
                raise
            except Exception as exc:  # yt-dlp lança DownloadError, etc.
                raise StreamError(f'Não foi possível obter o áudio: {exc}'[:300], 404) from exc
        ttl = cache_ttl(info.expires_at)
        if ttl > 0:
            await cache.set(key, asdict(info), ttl)
        return info


async def invalidate(video_id: str) -> None:
    await cache.delete(f'stream:{video_id}')
