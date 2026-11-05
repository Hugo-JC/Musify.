import pytest

from app.services.stream import cache_ttl, parse_expiry


@pytest.mark.parametrize(
    ("expires_at", "now", "expected"),
    [
        (10_000, 9_000, 880),
        (10_000, 9_880, 0),
        (10_000, 10_000, 0),
        (10_000, 1_000, 18_000),
    ],
)
def test_cache_ttl_never_keeps_near_expired_urls(expires_at, now, expected):
    assert cache_ttl(expires_at, now) == expected


def test_parse_expiry_uses_expire_query_parameter():
    assert parse_expiry("https://audio.example.test/file?expire=1700000000") == 1_700_000_000


def test_parse_expiry_falls_back_when_parameter_is_missing(monkeypatch):
    monkeypatch.setattr("app.services.stream.time.time", lambda: 1_000)
    assert parse_expiry("https://audio.example.test/file") == 4_600
