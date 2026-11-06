import time

from fastapi.testclient import TestClient

from app.cache import cache
from app.main import app
from app.routers import music
from app.schemas import Artist, Track
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
    assert stream_svc.cache_ttl(future, now) == 5 * 3600
    assert stream_svc.cache_ttl(now + 30, now) == 0


def test_normalize_track_and_thumbnail():
    item = {
        'id': 'dQw4w9WgXcQ',
        'snippet': {
            'title': 'Never Gonna Give You Up',
            'channelTitle': 'Rick Astley',
            'channelId': 'UCexample',
            'thumbnails': {
                'high': {'url': 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', 'width': 480, 'height': 360}
            },
        },
        'contentDetails': {'duration': 'PT3M33S'},
    }
    track = ytm.normalize_track(item)
    assert track is not None
    assert track.videoId == 'dQw4w9WgXcQ'
    assert track.source == 'youtube'
    assert track.title == 'Never Gonna Give You Up'
    assert len(track.artists) == 1
    assert track.artists[0].name == 'Rick Astley'
    assert track.artists[0].id == 'UCexample'
    assert track.durationSeconds == 213
    assert track.thumbnail == 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    assert ytm.normalize_track({'snippet': {'title': 'sem id'}}) is None


def test_music_search_prefers_youtube(monkeypatch):
    async def fake_run(fn, *args):
        assert fn is ytm.search_music_tracks
        return [Track(
            videoId='dQw4w9WgXcQ',
            title='YouTube result',
            artists=[Artist(name='Example artist')],
        )]

    monkeypatch.setattr(music.ytm, 'run', fake_run)
    with TestClient(app) as client:
        response = client.get('/api/music/search?q=backend-youtube-first-regression')
    assert response.status_code == 200
    payload = response.json()
    assert payload['provider'] == 'youtube'
    assert payload['tracks'][0]['videoId'] == 'dQw4w9WgXcQ'
    assert payload['tracks'][0]['source'] == 'youtube'


def test_music_search_falls_back_to_audius_when_youtube_is_empty(monkeypatch):
    async def fake_run(fn, *args):
        assert fn is ytm.search_music_tracks
        return []

    async def fake_audius_search(query, limit):
        return [{
            'id': 'audius-fallback-1',
            'source': 'audius',
            'title': 'Audius fallback',
        }]

    monkeypatch.setattr(music.ytm, 'run', fake_run)
    monkeypatch.setattr(music.audius, 'search_tracks', fake_audius_search)
    with TestClient(app) as client:
        response = client.get('/api/music/search?q=backend-audius-fallback-regression')
    assert response.status_code == 200
    payload = response.json()
    assert payload['provider'] == 'audius'
    assert payload['tracks'][0]['id'] == 'audius-fallback-1'


def test_recommendations_are_cached_per_channel(monkeypatch):
    calls = []

    async def fake_account(_session_id):
        return {
            'access_token': 'test-token',
            'channel': {'id': 'UC-musify-test-channel'},
        }

    async def fake_recommendations(_access_token, limit):
        calls.append(limit)
        return [Track(videoId='dQw4w9WgXcQ', title='Personal result')], True

    monkeypatch.setattr(music, 'get_account', fake_account)
    monkeypatch.setattr(music.discovery, 'recommend_from_likes', fake_recommendations)
    with TestClient(app) as client:
        response = client.get('/api/music/recommendations?limit=7')
    assert response.status_code == 200
    payload = response.json()
    assert payload['provider'] == 'youtube'
    assert payload['personalized'] is True
    assert payload['tracks'][0]['videoId'] == 'dQw4w9WgXcQ'
    assert calls == [7]


async def test_get_or_set_caches():
    calls = 0

    async def loader():
        nonlocal calls
        calls += 1
        return {'v': 1}

    key = f'test:{time.time()}'
    first, hit1 = await cache.get_or_set(key, 5, loader)
    second, hit2 = await cache.get_or_set(key, 5, loader)
    assert (hit1, hit2, calls) == (False, True, 1)
    assert first == second
