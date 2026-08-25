import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api, ApiError, type HealthResponse } from "./api/client";
import { Layout } from "./components/Layout";
import Artists from "./pages/Artists";
import Insights from "./pages/Insights";
import Recent from "./pages/Recent";
import Tracks from "./pages/Tracks";

/**
 * Top-level auth gate.
 *
 * - Backend down → ErrorCard fullscreen.
 * - Health pending → LoadingCard fullscreen.
 * - Not authenticated → LoginCard fullscreen.
 * - Authenticated → Layout (sidebar + main) wrapping the routed page.
 *
 * Routes are intentionally minimal: /tracks, /artists, /recent, with /
 * redirecting to /tracks as the default landing page.
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

  if (error) return <FullscreenShell><ErrorCard message={error} /></FullscreenShell>;
  if (!health) return <FullscreenShell><LoadingCard /></FullscreenShell>;
  if (!health.authenticated) return <FullscreenShell><LoginCard /></FullscreenShell>;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/tracks" replace />} />
        <Route path="tracks" element={<Tracks />} />
        <Route path="artists" element={<Artists />} />
        <Route path="recent" element={<Recent />} />
        <Route path="insights" element={<Insights />} />
        <Route path="*" element={<Navigate to="/tracks" replace />} />
      </Route>
    </Routes>
  );
}

function FullscreenShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-zinc-100 font-sans">
      <div className="mx-auto max-w-2xl px-8 py-24">{children}</div>
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
        className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-spotify px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
      >
        <SpotifyIcon className="h-4 w-4" />
        Log in with Spotify
      </a>
    </section>
  );
}

/**
 * Official Spotify icon glyph. Inline SVG so we don't need an external asset
 * and so it inherits text color (currentColor = black on the green button).
 */
function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 168 168"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M84 0C37.7 0 0 37.7 0 84s37.7 84 84 84 84-37.7 84-84S130.5 0 84 0zm38.5 121c-1.6 2.6-5 3.5-7.6 1.9-20.8-12.7-47-15.6-77.8-8.6-3 .7-6-1.2-6.6-4.2-.7-3 1.2-6 4.2-6.6 33.7-7.7 62.6-4.4 86 9.9 2.6 1.6 3.5 5 1.8 7.6zm10.3-22.9c-2 3.3-6.3 4.3-9.6 2.3-23.8-14.6-60.1-18.9-88.3-10.3-3.7 1.1-7.6-1-8.7-4.7-1.1-3.7 1-7.6 4.7-8.7 32.2-9.8 72.2-5 99.5 11.8 3.3 2 4.3 6.3 2.4 9.6zm.9-23.9C105 56.8 57.2 55 30 63.2c-4.4 1.3-9.1-1.2-10.5-5.6-1.3-4.4 1.2-9.1 5.6-10.5 31.2-9.5 84-7.6 117.4 12.5 4 2.4 5.3 7.6 2.9 11.6-2.4 4-7.6 5.3-11.7 2.9z" />
    </svg>
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
