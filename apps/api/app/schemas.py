from typing import Literal

from pydantic import BaseModel, Field


class Artist(BaseModel):
    id: str | None = None
    name: str


class Track(BaseModel):
    videoId: str
    title: str
    artists: list[Artist] = Field(default_factory=list)
    album: str | None = None
    durationSeconds: int | None = None
    thumbnail: str | None = None


class PlaylistCard(BaseModel):
    id: str
    title: str
    subtitle: str | None = None
    thumbnail: str | None = None
    kind: Literal['playlist', 'album', 'artist'] = 'playlist'


class Playlist(BaseModel):
    id: str
    title: str
    description: str | None = None
    author: str | None = None
    thumbnail: str | None = None
    trackCount: int = 0
    tracks: list[Track] = Field(default_factory=list)


class HomeResponse(BaseModel):
    quick: list[PlaylistCard]
    madeForYou: list[PlaylistCard]


class SearchResults(BaseModel):
    songs: list[Track]
    playlists: list[PlaylistCard]
    albums: list[PlaylistCard]
    artists: list[PlaylistCard]
