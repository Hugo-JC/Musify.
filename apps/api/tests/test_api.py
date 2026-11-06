import time

from fastapi.testclient import TestClient

from app.cache import cache
from app.main import app
from app.services import stream as stream_svc
from app.services import ytm


def test_health():
    with TestClient(app) as c:
        r = c.get('/api/health')
        assert r.status_code == 200
        assert r.json()['status'] == 'ok'


def test_auth_status_unauthenticated():
    with TestClient(app) as c:
        r = c.get('/api/auth/youtube/status')
        assert r.status_code == 200
        assert r.json() == {'connected': False, 'channel': None}


def test_unknown_mood():
    with TestClient(app) as c:
        assert c.get('/api/moods/nope').status_code == 404
        assert len(c.get('/api/moods').json()) == 3


def test_expiry_and_ttl():
    now = int(time.time())
    future = now + 6 * 3600
    url = f'https://rr1.googlevideo.com/videoplayback?expire={future}&x=1'
    assert stream_svc.parse_expiry(url) == future
    assert stream_svc.cache_ttl(future, now) == 5 * 3600  # limite máximo (5h)
    assert stream_svc.cache_ttl(now + 30, now) == 0  # URL quase expirada (< 120s) não deve ser guardada


def test_normalize_track_and_thumbnail():
    item = {
        'id': 'dQw4w9WgXcQ',
        'snippet': {
            'title': 'Never Gonna Give You Up',
            'channelTitle': 'Rick Astley',
            'thumbnails': {
                'high': {'url': 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', 'width': 480, 'height': 360}
            },
        },
        'contentDetails': {
            'duration': 'PT3M33S',
        },
    }
    t = ytm.normalize_track(item)
    assert t is not None
    assert t.videoId == 'dQw4w9WgXcQ'
    assert t.title == 'Never Gonna Give You Up'
    assert len(t.artists) == 1 and t.artists[0].name == 'Rick Astley'
    assert t.durationSeconds == 213
    assert t.thumbnail == 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    assert ytm.normalize_track({'snippet': {'title': 'sem id'}}) is None


async def test_get_or_set_caches():
    calls = 0

    async def loader():
        nonlocal calls
        calls += 1
        return {'v': 1}

    key = f'test:{time.time()}'
    first, hit1 = await cache.get_or_set(key, 5, loader)
    second, hit2 = await cache.get_or_set(key, 5, loader)
    assert (hit1, hit2, calls) == (False, True, 1) and first == second
