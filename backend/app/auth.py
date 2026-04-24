"""Spotify OAuth 2.0 (Authorization Code with PKCE) flow.

We use spotipy's SpotifyPKCE auth manager. Token JSON is cached on disk at
backend/.cache/token.json via spotipy's CacheFileHandler. The client secret
from .env is not required for PKCE and is intentionally not passed here; it's
kept in .env in case we need a non-PKCE fallback later.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from spotipy.cache_handler import CacheFileHandler
from spotipy.oauth2 import SpotifyPKCE

# backend/ is the parent of app/
BACKEND_DIR = Path(__file__).resolve().parent.parent
CACHE_DIR = BACKEND_DIR / ".cache"
CACHE_PATH = CACHE_DIR / "token.json"

# Load .env from backend/.env
load_dotenv(BACKEND_DIR / ".env")

SCOPES = [
    "user-top-read",
    "user-read-recently-played",
    "user-read-private",
    "user-read-email",
]


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Missing required env var: {name}. Set it in backend/.env"
        )
    return value


_auth_manager: SpotifyPKCE | None = None


def get_auth_manager() -> SpotifyPKCE:
    """Return a module-level SpotifyPKCE auth manager.

    PKCE requires the same code_verifier for both /authorize and /token calls.
    Spotipy stores the verifier on the instance, so /login and /callback must
    share one instance. Single-user local app → module singleton is fine.
    """
    global _auth_manager
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if _auth_manager is None:
        _auth_manager = SpotifyPKCE(
            client_id=_require_env("SPOTIFY_CLIENT_ID"),
            redirect_uri=_require_env("SPOTIFY_REDIRECT_URI"),
            scope=" ".join(SCOPES),
            cache_handler=CacheFileHandler(cache_path=str(CACHE_PATH)),
            open_browser=False,
        )
    return _auth_manager


def reset_auth_manager() -> None:
    """Drop the cached auth manager. Call on logout so the next login starts fresh."""
    global _auth_manager
    _auth_manager = None


def is_authenticated() -> bool:
    """True if we have a cached token (valid or refreshable)."""
    return CACHE_PATH.exists()


def clear_token_cache() -> None:
    if CACHE_PATH.exists():
        CACHE_PATH.unlink()
    reset_auth_manager()
