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


def test_invalid_video_id_is_rejected():
    with TestClient(app) as c:
        assert c.get('/api/stream/abc').status_code == 422
        assert c.post('/api/stream/../warm').status_code in (404, 422)


def test_unknown_mood():
    with TestClient(app) as c:
        assert c.get('/api/moods/nope').status_code == 404
        assert len(c.get('/api/moods').json()) == 3


def test_expiry_and_ttl():
    future = int(time.time()) + 6 * 3600
    url = f'https://rr1.googlevideo.com/videoplayback?expire={future}&x=1'
    assert stream_svc.parse_expiry(url) == future
    assert stream_svc.cache_ttl(future) == 5 * 3600  # limite máximo
    assert stream_svc.cache_ttl(int(time.time()) + 30) == 60  # limite mínimo


def test_normalize_track_and_thumbnail():
    t = ytm.normalize_track({
        'videoId': 'dQw4w9WgXcQ',
        'title': 'Song',
        'artists': [{'name': 'A', 'id': '1'}],
        'album': {'name': 'Alb'},
        'duration_seconds': 200,
        'thumbnails': [{'url': 'https://lh3.googleusercontent.com/x=w60-h60', 'width': 60, 'height': 60}],
    })
    assert t and t.album == 'Alb' and t.thumbnail.endswith('=w544-h544-l90-rj')
    assert ytm.normalize_track({'title': 'sem id'}) is None


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
