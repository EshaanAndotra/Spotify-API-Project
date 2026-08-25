# Spotify Listening Stats

A local dashboard for visualizing your Spotify listening data. Displays top tracks,
top artists, recent activity, and derived stats. FastAPI backend handles
OAuth and Spotify API calls; React frontend renders the views. Runs entirely
on your machine.

## Stack

- **Backend** - Python 3.11+, FastAPI, uvicorn, spotipy
- **Frontend** - React 18, Vite, TypeScript, Tailwind CSS, Recharts
- **Auth** - Spotify OAuth 2.0 with PKCE; token cached in `backend/.cache/`
- **Storage** - none. No database, no persistent user data beyond the OAuth
  cache file.

## Prerequisites

1. Python 3.11+
2. Node 18+
3. A Spotify account (free or premium — both work)
4. A registered Spotify app at <https://developer.spotify.com/dashboard>
   with `http://127.0.0.1:8000/callback` added as a redirect URI.

## Setup

Backend:

```
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1     # PowerShell on Windows
pip install -r requirements.txt
```

Create `backend/.env` with your Spotify app credentials:

```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
REDIRECT_URI=http://127.0.0.1:8000/callback
```

Frontend:

```
cd frontend
npm install
```

## Running

Two terminals.

Terminal 1 — backend:

```
cd backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — frontend:

```
cd frontend
npm run dev
```

Open <http://127.0.0.1:5173>. First load redirects you through Spotify's
consent page; subsequent loads use the cached token.

## Layout

```
backend/
  app/
    main.py        FastAPI routes
    auth.py        OAuth flow + token cache
    spotify.py     API wrappers (with 401 retry-once)
    models.py      Pydantic response shapes
  .env             SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, REDIRECT_URI
frontend/
  src/
    api/client.ts  Typed fetch wrapper
    pages/         Tracks, Artists, Recent, Insights
    components/    UI building blocks
```

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET  | `/login` | Redirect to Spotify consent |
| GET  | `/callback` | OAuth code exchange |
| GET  | `/me` | Current user profile |
| GET  | `/top/tracks?range=…&limit=…` | Top tracks (1-100) |
| GET  | `/top/artists?range=…&limit=…` | Top artists (1-100) |
| GET  | `/recent?limit=…` | Last plays (1-50) |
| GET  | `/audio-features?ids=…` | Audio features (see note) |
| POST | `/logout` | Clear token cache |

`range` is one of `short_term` (~4 weeks), `medium_term` (~6 months),
`long_term` (~years).

## Known Spotify API limitations

As of November 2024, Spotify locked down several fields for newly-registered
apps. If your app was created after that date, expect:

- `popularity` returns `null` on tracks and artists
- `genres` returns `[]` on artists
- `followers` returns `null` on artists
- `/audio-features` returns 403

The dashboard avoids these fields where it can - Insights is built from
durations, release dates, artist references, and play timestamps, all of
which still work. Nothing the app can do to recover the others; this is a
Spotify-side restriction.

## Out of scope (v1)

Multi-user support, persistent database, deployment, mobile responsive
beyond "doesn't break."
