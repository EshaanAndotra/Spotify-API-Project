"""Pydantic response models shared across routes.

Keeping shapes here so the frontend has a stable contract to type against.
More models get added as endpoints come online.
"""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class TimeRange(str, Enum):
    """Spotify's three listening windows for /me/top/*.

    short_term  ≈ last 4 weeks
    medium_term ≈ last 6 months
    long_term   ≈ several years
    """
    short_term = "short_term"
    medium_term = "medium_term"
    long_term = "long_term"


class HealthResponse(BaseModel):
    status: str
    authenticated: bool


class LogoutResponse(BaseModel):
    ok: bool


class UserImage(BaseModel):
    url: str
    width: int | None = None
    height: int | None = None


class UserProfile(BaseModel):
    id: str
    display_name: str | None = None
    email: str | None = None
    country: str | None = None
    product: str | None = None
    followers: int | None = None
    images: list[UserImage] = []
    external_url: str | None = None


class ArtistRef(BaseModel):
    """Minimal artist reference — appears inline on tracks and albums."""
    id: str
    name: str
    external_url: str | None = None


class AlbumRef(BaseModel):
    """Minimal album reference — appears inline on tracks."""
    id: str
    name: str
    release_date: str | None = None
    image_url: str | None = None  # Largest available album art, or None.
    external_url: str | None = None


class Track(BaseModel):
    id: str
    name: str
    artists: list[ArtistRef]
    album: AlbumRef
    duration_ms: int
    popularity: int | None = None
    preview_url: str | None = None
    external_url: str | None = None


class TopTracksResponse(BaseModel):
    range: TimeRange
    items: list[Track]


class Artist(BaseModel):
    """Full artist object returned by /me/top/artists.

    Distinct from ArtistRef, which is the inline stub on Track/Album.
    """
    id: str
    name: str
    genres: list[str] = []
    popularity: int | None = None
    followers: int | None = None
    image_url: str | None = None
    external_url: str | None = None


class TopArtistsResponse(BaseModel):
    range: TimeRange
    items: list[Artist]


class PlayContext(BaseModel):
    """Where a play came from — playlist, album, artist page, etc.

    Absent for tracks played from outside a container (e.g. direct search).
    """
    type: str  # "playlist" | "album" | "artist" | "show" | ...
    external_url: str | None = None


class RecentPlay(BaseModel):
    track: Track
    played_at: str  # ISO 8601 from Spotify, kept as string — frontend parses.
    context: PlayContext | None = None


class RecentResponse(BaseModel):
    items: list[RecentPlay]


class AudioFeatures(BaseModel):
    """Spotify audio analysis values for a single track.

    All feature floats are in [0, 1] except tempo (BPM) and loudness (dB).
    `key` is -1 if no key detected; `mode` is 0 (minor) or 1 (major).
    Every track ID in the request gets an entry here, but the entry may be
    null-valued if Spotify couldn't analyze the track — callers should
    treat fields as optional.
    """
    id: str
    danceability: float | None = None
    energy: float | None = None
    valence: float | None = None
    tempo: float | None = None
    acousticness: float | None = None
    instrumentalness: float | None = None
    liveness: float | None = None
    speechiness: float | None = None
    loudness: float | None = None
    key: int | None = None
    mode: int | None = None
    time_signature: int | None = None
    duration_ms: int | None = None


class AudioFeaturesResponse(BaseModel):
    items: list[AudioFeatures]
