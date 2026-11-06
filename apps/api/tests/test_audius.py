from fastapi.testclient import TestClient

from app.main import app
from app.routers import music
from app.services.audius import normalize_track


def test_normalize_audius_track():
    track = normalize_track({
        "id": 123,
        "title": "Demo",
        "duration": 187,
        "permalink": "https://audius.co/artist/demo",
        "artwork": {"480x480": "https://cdn.example/art.jpg"},
        "user": {"id": 7, "name": "Artist"},
        "is_available": True,
        "is_streamable": True,
        "is_stream_gated": False,
        "license": "CC BY",
    })
    assert track == {
        "id": "123",
        "source": "audius",
        "title": "Demo",
        "artist": "Artist",
        "artistId": "7",
        "durationSeconds": 187,
        "artwork": "https://cdn.example/art.jpg",
        "permalink": "https://audius.co/artist/demo",
        "streamUrl": "/api/music/tracks/123/stream",
        "license": "CC BY",
        "isStreamable": True,
        "isStreamGated": False,
    }


def test_normalize_skips_unavailable_or_missing_id():
    assert normalize_track({"title": "Missing ID"}) is None
    assert normalize_track({"id": 1, "is_available": False}) is None
    assert normalize_track({"id": 1, "is_delete": True}) is None
    assert normalize_track({"id": "../bad", "is_streamable": True}) is None


def test_normalize_stream_permissions():
    unavailable = normalize_track({"id": 1, "is_streamable": False})
    gated_by_flag = normalize_track({
        "id": 2,
        "is_streamable": True,
        "is_stream_gated": True,
    })
    gated_by_conditions = normalize_track({
        "id": 3,
        "is_streamable": True,
        "stream_conditions": {"follow": {"user_id": "artist"}},
    })

    assert unavailable["isStreamable"] is False
    assert gated_by_flag["isStreamGated"] is True
    assert gated_by_conditions["isStreamGated"] is True


def test_stream_endpoint_rejects_gated_track(monkeypatch):
    async def fake_get_track(_track_id):
        return {
            "id": "gated-123",
            "isStreamGated": True,
            "isStreamable": True,
        }

    monkeypatch.setattr(music.audius, "get_track", fake_get_track)

    with TestClient(app) as client:
        response = client.get(
            "/api/music/tracks/gated-123/stream",
            follow_redirects=False,
        )

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "AUDIUS_STREAM_GATED"


def test_stream_endpoint_rejects_non_streamable_track(monkeypatch):
    async def fake_get_track(_track_id):
        return {
            "id": "blocked-123",
            "isStreamGated": False,
            "isStreamable": False,
        }

    monkeypatch.setattr(music.audius, "get_track", fake_get_track)

    with TestClient(app) as client:
        response = client.get(
            "/api/music/tracks/blocked-123/stream",
            follow_redirects=False,
        )

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "AUDIUS_STREAM_UNAVAILABLE"


def test_stream_endpoint_redirects_only_allowed_track(monkeypatch):
    async def fake_get_track(_track_id):
        return {
            "id": "allowed-123",
            "isStreamGated": False,
            "isStreamable": True,
        }

    monkeypatch.setattr(music.audius, "get_track", fake_get_track)
    monkeypatch.setattr(
        music.audius,
        "stream_url",
        lambda track_id: f"https://api.audius.co/v1/tracks/{track_id}/stream?app_name=Musify",
    )

    with TestClient(app) as client:
        response = client.get(
            "/api/music/tracks/allowed-123/stream",
            follow_redirects=False,
        )

    assert response.status_code == 307
    assert response.headers["location"].startswith(
        "https://api.audius.co/v1/tracks/allowed-123/stream?"
    )


def test_stream_endpoint_rejects_invalid_track_id():
    with TestClient(app) as client:
        response = client.get(
            "/api/music/tracks/invalid.id/stream",
            follow_redirects=False,
        )
    assert response.status_code == 422
