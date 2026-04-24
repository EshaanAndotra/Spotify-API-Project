import { useEffect, useState } from "react";
import { api, ApiError, type HealthResponse } from "./api/client";
import { ProfileHeader } from "./components/ProfileHeader";
import { Recent } from "./components/Recent";
import { TopArtists } from "./components/TopArtists";
import { TopTracks } from "./components/TopTracks";

/**
 * Shell-only app.
 *
 * Goals for this first increment:
 * - Prove Vite/React/Tailwind pipeline works (dark base, Spotify-green accent).
 * - Prove the frontend can reach the backend (calls /health).
 * - Show a login call-to-action when not authenticated, a placeholder dashboard when we are.
 *
 * Feature components (TopTracks, TopArtists, Recent, etc.) come in later increments.
 */
export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-full bg-surface text-zinc-100 font-sans">
      <header className="border-b border-surface-border">
        <div className="mx-auto max-w-6xl px-8 py-6 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              Listening Stats
            </h1>
            <span className="text-xs text-zinc-500">v0</span>
          </div>
          {health?.authenticated && !error ? (
            <ProfileHeader />
          ) : (
            <BackendStatus health={health} error={error} />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-12">
        {error && <ErrorCard message={error} />}
        {!error && health && !health.authenticated && <LoginCard />}
        {!error && health?.authenticated && <DashboardPlaceholder />}
        {!error && !health && <LoadingCard />}
      </main>
    </div>
  );
}

function BackendStatus({
  health,
  error,
}: {
  health: HealthResponse | null;
  error: string | null;
}) {
  const color = error
    ? "bg-red-500"
    : health?.authenticated
    ? "bg-spotify"
    : health
    ? "bg-zinc-500"
    : "bg-zinc-700";
  const label = error
    ? "backend unreachable"
    : health?.authenticated
    ? "connected"
    : health
    ? "logged out"
    : "checking…";
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}

function LoginCard() {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised p-10">
      <h2 className="text-2xl font-semibold tracking-tight">
        Connect your Spotify account
      </h2>
      <p className="mt-3 text-zinc-400 max-w-prose">
        This app reads your top tracks, top artists, and recent listens using
        Spotify's API. It runs entirely on your machine — nothing leaves it.
      </p>
      <a
        href={api.loginUrl()}
        className="mt-8 inline-flex items-center rounded-full bg-spotify px-6 py-2.5 text-sm font-medium text-black hover:brightness-110"
      >
        Log in with Spotify
      </a>
    </section>
  );
}

function DashboardPlaceholder() {
  return (
    <div className="space-y-8">
      <TopTracks />
      <TopArtists />
      <Recent />
    </div>
  );
}

function LoadingCard() {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised p-10 text-zinc-500">
      Checking backend…
    </section>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-red-900/50 bg-red-950/30 p-6">
      <h2 className="text-lg font-semibold text-red-300">
        Can't reach the backend
      </h2>
      <p className="mt-2 text-sm text-red-200/80">{message}</p>
      <p className="mt-4 text-sm text-zinc-400">
        Make sure uvicorn is running on{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 text-zinc-300">
          http://127.0.0.1:8000
        </code>
        .
      </p>
    </section>
  );
}
