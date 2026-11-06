from app.services import ytm


def test_music_search_does_not_restrict_youtube_category(monkeypatch):
    calls = []

    def fake_request(resource, params):
        calls.append((resource, params))
        if resource == "search":
            return {
                "items": [
                    {"id": {"videoId": "video-music-category-mismatch"}},
                ],
            }
        if resource == "videos":
            return {
                "items": [{
                    "id": "video-music-category-mismatch",
                    "snippet": {
                        "title": "Official music video",
                        "channelTitle": "Example Artist",
                        "channelId": "UC-example",
                        "thumbnails": {
                            "high": {
                                "url": "https://i.ytimg.com/vi/example/hqdefault.jpg",
                                "width": 480,
                                "height": 360,
                            },
                        },
                    },
                    "contentDetails": {"duration": "PT3M20S"},
                    "status": {"privacyStatus": "public", "embeddable": True},
                }],
            }
        raise AssertionError(f"Unexpected resource: {resource}")

    monkeypatch.setattr(ytm, "_request", fake_request)

    tracks = ytm.search_music_tracks("Example Artist official music", 10)

    assert len(tracks) == 1
    assert tracks[0].videoId == "video-music-category-mismatch"
    assert tracks[0].source == "youtube"
    search_params = calls[0][1]
    assert search_params["videoEmbeddable"] == "true"
    assert "videoCategoryId" not in search_params


def test_music_search_skips_non_embeddable_videos(monkeypatch):
    def fake_request(resource, params):
        if resource == "search":
            return {"items": [{"id": {"videoId": "private-video"}}]}
        if resource == "videos":
            return {"items": [{
                "id": "private-video",
                "snippet": {"title": "Unavailable", "channelTitle": "Artist"},
                "status": {"privacyStatus": "public", "embeddable": False},
            }]}
        raise AssertionError(f"Unexpected resource: {resource}")

    monkeypatch.setattr(ytm, "_request", fake_request)
    assert ytm.search_music_tracks("Artist song") == []
