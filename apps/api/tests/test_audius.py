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
        "isStreamGated": False,
    }


def test_normalize_skips_unavailable_or_missing_id():
    assert normalize_track({"title": "Missing ID"}) is None
    assert normalize_track({"id": 1, "is_available": False}) is None
    assert normalize_track({"id": 1, "is_delete": True}) is None
