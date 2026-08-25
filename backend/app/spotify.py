"""Spotify Web API wrappers.

Endpoints get built out here one at a time. Each wrapper function takes a
spotipy.Spotify client (built fresh per-request from the auth manager) so
token refresh happens transparently.
"""
from __future__ import annotations

from typing import Any, Callable, TypeVar

import spotipy
from spotipy.exceptions import SpotifyException

from .auth import CACHE_PATH, get_auth_manager
from .models import AlbumRef, Artist, ArtistRef, Track

T = TypeVar("T")


class NotAuthenticatedError(Exception):
    """No token cached or token can't be refreshed — user needs to /login again."""


def get_client() -> spotipy.Spotify:
    """Build a Spotify API client using the cached token.

    Raises NotAuthenticatedError if no cached token exists.
    """
    if not CACHE_PATH.exists():
        raise NotAuthenticatedError("No cached Spotify token. Hit /login first.")
    return spotipy.Spotify(auth_manager=get_auth_manager())


def call_with_retry(fn: Callable[[spotipy.Spotify], T]) -> T:
    """Call `fn(client)`. On a 401, force-refresh the token and retry once.

    Spotipy normally refreshes expired tokens itself, but if the cached access
    token was invalidated server-side (revoked, scope change, etc.) spotipy
    still hands it out. This wrapper catches that case, refreshes, retries once,
    and re-raises the real error if the retry also fails — per project rule
    "don't swallow the error."
    """
    client = get_client()
    try:
        return fn(client)
    except SpotifyException as e:
        if e.http_status != 401:
            raise
        # Force a refresh via the auth manager, then retry with a fresh client.
        auth_manager = get_auth_manager()
        token_info = auth_manager.cache_handler.get_cached_token()
        if not token_info or "refresh_token" not in token_info:
            raise NotAuthenticatedError("Token expired and no refresh token available.") from e
        auth_manager.refresh_access_token(token_info["refresh_token"])
        retry_client = spotipy.Spotify(auth_manager=auth_manager)
        return fn(retry_client)


def current_user() -> dict[str, Any]:
    """GET /me — current user profile."""
    return call_with_retry(lambda c: c.current_user())


def _PAGED_PAGE_SIZE() -> int:
    """Spotify's hard cap on /me/top/* requests. Keep this in one place."""
    return 50


def top_tracks(time_range: str, limit: int = 20) -> list[dict[str, Any]]:
    """GET /me/top/tracks — returns the raw `items` list from Spotify.

    Spotify caps each request at 50, so we page when the caller wants more.
    Stops early if Spotify returns a short page (means we've hit the end).
    """
    def _fetch(c: spotipy.Spotify) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        remaining = limit
        offset = 0
        page_size = _PAGED_PAGE_SIZE()
        while remaining > 0:
            chunk = min(remaining, page_size)
            resp = c.current_user_top_tracks(
                limit=chunk, offset=offset, time_range=time_range,
            )
            page = resp.get("items", []) if resp else []
            items.extend(page)
            if len(page) < chunk:
                break  # no more data on Spotify's side
            remaining -= chunk
            offset += chunk
        return items
    return call_with_retry(_fetch)


def top_artists(time_range: str, limit: int = 20) -> list[dict[str, Any]]:
    """GET /me/top/artists — returns the raw `items` list from Spotify.

    Same pagination strategy as top_tracks (Spotify caps single calls at 50).
    """
    def _fetch(c: spotipy.Spotify) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        remaining = limit
        offset = 0
        page_size = _PAGED_PAGE_SIZE()
        while remaining > 0:
            chunk = min(remaining, page_size)
            resp = c.current_user_top_artists(
                limit=chunk, offset=offset, time_range=time_range,
            )
            page = resp.get("items", []) if resp else []
            items.extend(page)
            if len(page) < chunk:
                break
            remaining -= chunk
            offset += chunk
        return items
    return call_with_retry(_fetch)


def recently_played(limit: int = 20) -> list[dict[str, Any]]:
    """GET /me/player/recently-played — returns raw play-history items.

    Spotify caps `limit` at 50. Each item is {track, played_at, context}.
    """
    def _fetch(c: spotipy.Spotify) -> list[dict[str, Any]]:
        resp = c.current_user_recently_played(limit=limit)
        return resp.get("items", []) if resp else []
    return call_with_retry(_fetch)


def audio_features(track_ids: list[str]) -> list[dict[str, Any] | None]:
    """GET /audio-features — one entry per input ID, aligned by index.

    Spotify allows up to 100 IDs per request. An entry may be None if Spotify
    has no features for that track.

    NOTE: as of Nov 2024 Spotify disabled this endpoint for newly-registered
    apps; expect a 403 there. Older apps retain access.
    """
    def _fetch(c: spotipy.Spotify) -> list[dict[str, Any] | None]:
        resp = c.audio_features(tracks=track_ids)
        return list(resp) if resp else []
    return call_with_retry(_fetch)


def _largest_image(images: list[dict[str, Any]] | None) -> str | None:
    """Pick the largest image URL from a Spotify images array, or None."""
    if not images:
        return None
    # Spotify returns images sorted largest-first, but don't rely on that.
    sized = [i for i in images if i.get("width") is not None]
    if sized:
        return max(sized, key=lambda i: i["width"])["url"]
    return images[0].get("url")


def to_artist(raw: dict[str, Any]) -> Artist:
    """Map Spotify's raw artist JSON into our Pydantic Artist model."""
    return Artist(
        id=raw["id"],
        name=raw["name"],
        genres=raw.get("genres") or [],
        popularity=raw.get("popularity"),
        followers=(raw.get("followers") or {}).get("total"),
        image_url=_largest_image(raw.get("images")),
        external_url=(raw.get("external_urls") or {}).get("spotify"),
    )


def to_track(raw: dict[str, Any]) -> Track:
    """Map Spotify's raw track JSON into our Pydantic Track model.

    Reused by /top/tracks and /recent, so any shape drift gets caught once.
    """
    album_raw = raw.get("album") or {}
    return Track(
        id=raw["id"],
        name=raw["name"],
        artists=[
            ArtistRef(
                id=a["id"],
                name=a["name"],
                external_url=(a.get("external_urls") or {}).get("spotify"),
            )
            for a in (raw.get("artists") or [])
        ],
        album=AlbumRef(
            id=album_raw.get("id", ""),
            name=album_raw.get("name", ""),
            release_date=album_raw.get("release_date"),
            image_url=_largest_image(album_raw.get("images")),
            external_url=(album_raw.get("external_urls") or {}).get("spotify"),
        ),
        duration_ms=raw.get("duration_ms", 0),
        popularity=raw.get("popularity"),
        preview_url=raw.get("preview_url"),
        external_url=(raw.get("external_urls") or {}).get("spotify"),
    )
