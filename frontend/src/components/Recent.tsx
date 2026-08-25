import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type RecentPlay } from "../api/client";

const CONTEXT_LABEL: Record<string, string> = {
  playlist: "Playlist",
  album: "Album",
  artist: "Artist",
  show: "Show",
  collection: "Library",
};

export function Recent() {
  const [plays, setPlays] = useState<RecentPlay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .recent(20)
      .then((resp) => {
        if (!cancelled) setPlays(resp.items);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return load();
  }, [load]);

  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised p-8">
      <div className="flex justify-end">
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full border border-surface-border px-4 py-1.5 text-sm text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mt-6">
        {error && <InlineError message={error} />}
        {!error && !plays && <SkeletonList />}
        {!error && plays && plays.length === 0 && (
          <p className="text-sm text-zinc-500">
            No recent plays — Spotify resets this list after 24 hours of silence.
          </p>
        )}
        {!error && plays && plays.length > 0 && <PlayList plays={plays} />}
      </div>
    </section>
  );
}

function PlayList({ plays }: { plays: RecentPlay[] }) {
  return (
    <ol className="divide-y divide-surface-border">
      {plays.map((p, i) => (
        <PlayRow key={`${p.track.id}-${p.played_at}-${i}`} play={p} />
      ))}
    </ol>
  );
}

function PlayRow({ play }: { play: RecentPlay }) {
  const { track, played_at, context } = play;
  const artists = track.artists.map((a) => a.name).join(", ");

  return (
    <li className="flex items-center gap-5 py-3">
      <AlbumArt url={track.album.image_url} alt={track.album.name} />
      <div className="min-w-0 flex-1">
        <a
          href={track.external_url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm font-medium text-zinc-100 hover:underline"
        >
          {track.name}
        </a>
        <div className="mt-0.5 flex items-center gap-2 min-w-0">
          <p className="truncate text-xs text-zinc-500">{artists}</p>
          {context && <ContextChip context={context} />}
        </div>
      </div>
      <span
        className="text-xs tabular-nums text-zinc-500 min-w-[90px] text-right"
        title={new Date(played_at).toLocaleString()}
      >
        {formatRelative(played_at)}
      </span>
    </li>
  );
}

function ContextChip({ context }: { context: { type: string; external_url: string | null } }) {
  const label = CONTEXT_LABEL[context.type] ?? context.type;
  const chip = (
    <span className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
      {label}
    </span>
  );
  if (!context.external_url) return chip;
  return (
    <a
      href={context.external_url}
      target="_blank"
      rel="noreferrer"
      className="hover:opacity-80"
    >
      {chip}
    </a>
  );
}

function AlbumArt({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return <div className="h-11 w-11 flex-shrink-0 rounded bg-surface" />;
  }
  return (
    <img
      src={url}
      alt={alt}
      className="h-11 w-11 flex-shrink-0 rounded object-cover"
      loading="lazy"
    />
  );
}

function SkeletonList() {
  return (
    <ul className="divide-y divide-surface-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-5 py-3">
          <div className="h-11 w-11 rounded bg-surface" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-surface" />
            <div className="h-2.5 w-1/4 rounded bg-surface" />
          </div>
          <div className="h-3 w-16 rounded bg-surface" />
        </li>
      ))}
    </ul>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200/80">
      {message}
    </div>
  );
}

/**
 * Human-friendly relative time. Kept dependency-free — date-fns would bloat the
 * bundle for a single use.
 */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.round((Date.now() - then) / 1000);

  if (diffSec < 30) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
