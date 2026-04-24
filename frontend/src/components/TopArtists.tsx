import { useEffect, useState } from "react";
import { api, ApiError, type Artist, type TimeRange } from "../api/client";
import { RangeToggle } from "./RangeToggle";

export function TopArtists() {
  const [range, setRange] = useState<TimeRange>("medium_term");
  const [artists, setArtists] = useState<Artist[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setArtists(null);
    setError(null);
    api
      .topArtists(range, 20)
      .then((resp) => {
        if (!cancelled) setArtists(resp.items);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised p-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Top Artists</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Your most-played artists over the selected window.
          </p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <div className="mt-8">
        {error && <InlineError message={error} />}
        {!error && !artists && <SkeletonList />}
        {!error && artists && artists.length === 0 && (
          <p className="text-sm text-zinc-500">No artists in this range.</p>
        )}
        {!error && artists && artists.length > 0 && (
          <ArtistList artists={artists} />
        )}
      </div>
    </section>
  );
}

function ArtistList({ artists }: { artists: Artist[] }) {
  return (
    <ol className="divide-y divide-surface-border">
      {artists.map((a, i) => (
        <ArtistRow key={a.id} artist={a} rank={i + 1} />
      ))}
    </ol>
  );
}

function ArtistRow({ artist, rank }: { artist: Artist; rank: number }) {
  return (
    <li className="flex items-center gap-5 py-3">
      <span className="w-6 text-right text-sm tabular-nums text-zinc-500">
        {rank}
      </span>
      <ArtistAvatar url={artist.image_url} alt={artist.name} />
      <div className="min-w-0 flex-1">
        <a
          href={artist.external_url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm font-medium text-zinc-100 hover:underline"
        >
          {artist.name}
        </a>
        {artist.genres.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5 overflow-hidden max-h-5">
            {artist.genres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
      {artist.followers != null && (
        <span className="text-xs tabular-nums text-zinc-500">
          {formatFollowers(artist.followers)} followers
        </span>
      )}
    </li>
  );
}

function ArtistAvatar({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return <div className="h-11 w-11 flex-shrink-0 rounded-full bg-surface" />;
  }
  return (
    <img
      src={url}
      alt={alt}
      className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
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
          <div className="h-11 w-11 rounded-full bg-surface" />
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

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}
