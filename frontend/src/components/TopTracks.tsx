import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type TimeRange, type Track } from "../api/client";
import { RangeToggle } from "./RangeToggle";
import { SearchBox } from "./SearchBox";

export function TopTracks() {
  const [range, setRange] = useState<TimeRange>("medium_term");
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setTracks(null);
    setError(null);
    api
      .topTracks(range, 100)
      .then((resp) => {
        if (!cancelled) setTracks(resp.items);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  // Filter by track name OR any contributing artist's name. Rank stays
  // pinned to the original position — your "true" #15 should still say 15
  // even when filtered down.
  const filtered = useMemo(() => {
    if (!tracks) return null;
    const q = query.trim().toLowerCase();
    if (!q) return tracks.map((t, i) => ({ track: t, rank: i + 1 }));
    return tracks
      .map((t, i) => ({ track: t, rank: i + 1 }))
      .filter(
        ({ track }) =>
          track.name.toLowerCase().includes(q) ||
          track.artists.some((a) => a.name.toLowerCase().includes(q)),
      );
  }, [tracks, query]);

  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Filter tracks or artists…"
        />
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <div className="mt-6">
        {error && <InlineError message={error} />}
        {!error && !tracks && <SkeletonList />}
        {!error && tracks && tracks.length === 0 && (
          <p className="text-sm text-zinc-500">No tracks in this range.</p>
        )}
        {!error && filtered && tracks && tracks.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-zinc-500">No matches for "{query}".</p>
        )}
        {!error && filtered && filtered.length > 0 && <TrackList rows={filtered} />}
      </div>
    </section>
  );
}

function TrackList({ rows }: { rows: { track: Track; rank: number }[] }) {
  return (
    <ol className="divide-y divide-surface-border">
      {rows.map(({ track, rank }) => (
        <TrackRow key={track.id} track={track} rank={rank} />
      ))}
    </ol>
  );
}

function TrackRow({ track, rank }: { track: Track; rank: number }) {
  const artists = track.artists.map((a) => a.name).join(", ");
  return (
    <li className="flex items-center gap-5 py-3">
      <span className="w-6 text-right text-sm tabular-nums text-zinc-500">
        {rank}
      </span>
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
        <p className="mt-0.5 truncate text-xs text-zinc-500">{artists}</p>
      </div>
      <span className="hidden sm:block truncate text-xs text-zinc-500 max-w-[200px]">
        {track.album.name}
      </span>
      <span className="text-xs tabular-nums text-zinc-500 min-w-[48px] text-right">
        {formatDuration(track.duration_ms)}
      </span>
    </li>
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
          <span className="w-6" />
          <div className="h-11 w-11 rounded bg-surface" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-surface" />
            <div className="h-2.5 w-1/4 rounded bg-surface" />
          </div>
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

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
