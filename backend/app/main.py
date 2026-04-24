"""FastAPI entrypoint.

Run from backend/:
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from spotipy.exceptions import SpotifyException

from . import auth, spotify
from .models import (
    AudioFeatures,
    AudioFeaturesResponse,
    HealthResponse,
    LogoutResponse,
    PlayContext,
    RecentPlay,
    RecentResponse,
    TimeRange,
    TopArtistsResponse,
    TopTracksResponse,
    UserImage,
    UserProfile,
)
from .spotify import NotAuthenticatedError

app = FastAPI(title="Spotify Listening Stats", version="0.1.0")

# Vite dev server. Adjust if you ever change the port.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", authenticated=auth.is_authenticated())


@app.get("/login")
def login() -> RedirectResponse:
    """Kick off the Spotify OAuth flow by redirecting to Spotify's consent page."""
    auth_manager = auth.get_auth_manager()
    authorize_url = auth_manager.get_authorize_url()
    return RedirectResponse(authorize_url)


@app.get("/callback")
def callback(
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
) -> RedirectResponse:
    """Handle Spotify's redirect back. Exchange code for a token, cache it,
    then bounce the user to the frontend."""
    if error:
        raise HTTPException(status_code=400, detail=f"Spotify auth error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing 'code' query param")

    auth_manager = auth.get_auth_manager()
    # Exchanges the code for an access + refresh token and writes it to the
    # cache file via the CacheFileHandler configured in auth.get_auth_manager().
    # SpotifyPKCE.get_access_token only accepts (code, check_cache) — no as_dict.
    auth_manager.get_access_token(code, check_cache=False)

    # Send the user back to the frontend so they see the dashboard.
    return RedirectResponse("http://127.0.0.1:5173/")


@app.get("/me", response_model=UserProfile)
def me() -> UserProfile:
    try:
        profile = spotify.current_user()
    except NotAuthenticatedError as e:
        raise HTTPException(status_code=401, detail=str(e))

    return UserProfile(
        id=profile["id"],
        display_name=profile.get("display_name"),
        email=profile.get("email"),
        country=profile.get("country"),
        product=profile.get("product"),
        followers=(profile.get("followers") or {}).get("total"),
        images=[
            UserImage(url=img["url"], width=img.get("width"), height=img.get("height"))
            for img in (profile.get("images") or [])
        ],
        external_url=(profile.get("external_urls") or {}).get("spotify"),
    )


@app.get("/top/tracks", response_model=TopTracksResponse)
def top_tracks(
    range: TimeRange = Query(
        default=TimeRange.medium_term,
        description="Spotify listening window",
    ),
    limit: int = Query(default=20, ge=1, le=50),
) -> TopTracksResponse:
    """Top tracks for the authenticated user in the given time range."""
    try:
        raw = spotify.top_tracks(time_range=range.value, limit=limit)
    except NotAuthenticatedError as e:
        raise HTTPException(status_code=401, detail=str(e))

    return TopTracksResponse(
        range=range,
        items=[spotify.to_track(t) for t in raw],
    )


@app.get("/top/artists", response_model=TopArtistsResponse)
def top_artists(
    range: TimeRange = Query(
        default=TimeRange.medium_term,
        description="Spotify listening window",
    ),
    limit: int = Query(default=20, ge=1, le=50),
) -> TopArtistsResponse:
    """Top artists for the authenticated user in the given time range."""
    try:
        raw = spotify.top_artists(time_range=range.value, limit=limit)
    except NotAuthenticatedError as e:
        raise HTTPException(status_code=401, detail=str(e))

    return TopArtistsResponse(
        range=range,
        items=[spotify.to_artist(a) for a in raw],
    )


@app.get("/recent", response_model=RecentResponse)
def recent(
    limit: int = Query(default=20, ge=1, le=50),
) -> RecentResponse:
    """Most recently played tracks for the authenticated user."""
    try:
        raw = spotify.recently_played(limit=limit)
    except NotAuthenticatedError as e:
        raise HTTPException(status_code=401, detail=str(e))

    items: list[RecentPlay] = []
    for entry in raw:
        ctx_raw = entry.get("context") or None
        ctx = (
            PlayContext(
                type=ctx_raw.get("type", "unknown"),
                external_url=(ctx_raw.get("external_urls") or {}).get("spotify"),
            )
            if ctx_raw
            else None
        )
        items.append(
            RecentPlay(
                track=spotify.to_track(entry["track"]),
                played_at=entry["played_at"],
                context=ctx,
            )
        )
    return RecentResponse(items=items)


@app.get("/audio-features", response_model=AudioFeaturesResponse)
def audio_features(
    ids: str = Query(
        ...,
        description="Comma-separated track IDs (max 100)",
    ),
) -> AudioFeaturesResponse:
    """Audio feature analysis for the given track IDs.

    NOTE: Spotify disabled this endpoint for apps created after Nov 2024. If
    you get a 403 surfaced to the frontend here, that's why — not an auth bug.
    """
    track_ids = [i.strip() for i in ids.split(",") if i.strip()]
    if not track_ids:
        raise HTTPException(status_code=400, detail="Provide at least one track ID")
    if len(track_ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 track IDs per request")

    try:
        raw = spotify.audio_features(track_ids)
    except NotAuthenticatedError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except SpotifyException as e:
        # Bubble Spotify's HTTP status through — don't swallow it (per project rule).
        raise HTTPException(status_code=e.http_status, detail=str(e))

    items: list[AudioFeatures] = []
    for track_id, entry in zip(track_ids, raw):
        if not entry:
            items.append(AudioFeatures(id=track_id))
            continue
        items.append(
            AudioFeatures(
                id=entry.get("id", track_id),
                danceability=entry.get("danceability"),
                energy=entry.get("energy"),
                valence=entry.get("valence"),
                tempo=entry.get("tempo"),
                acousticness=entry.get("acousticness"),
                instrumentalness=entry.get("instrumentalness"),
                liveness=entry.get("liveness"),
                speechiness=entry.get("speechiness"),
                loudness=entry.get("loudness"),
                key=entry.get("key"),
                mode=entry.get("mode"),
                time_signature=entry.get("time_signature"),
                duration_ms=entry.get("duration_ms"),
            )
        )
    return AudioFeaturesResponse(items=items)


@app.post("/logout", response_model=LogoutResponse)
def logout() -> LogoutResponse:
    auth.clear_token_cache()
    return LogoutResponse(ok=True)
