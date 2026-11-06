from app.schemas import Artist, Track
from app.services.recommendations import _seed_query


def test_seed_query_uses_the_most_common_liked_artists():
    seeds = [
        Track(videoId='video-1', title='Song one', artists=[Artist(name='Artist A')]),
        Track(videoId='video-2', title='Song two', artists=[Artist(name='Artist A')]),
        Track(videoId='video-3', title='Song three', artists=[Artist(name='Artist B')]),
    ]
    assert _seed_query(seeds) == 'Artist A Artist B similar music'


def test_seed_query_falls_back_to_a_liked_song_title():
    seeds = [Track(videoId='video-1', title='A liked song')]
    assert _seed_query(seeds) == 'A liked song similar songs'
