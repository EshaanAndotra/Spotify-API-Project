import { useEffect, useState, type ReactNode } from "react";
import {
  api,
  ApiError,
  type Artist,
  type RecentPlay,
  type TimeRange,
  type Track,
} from "../api/client";
import { ArtistDistribution } from "../components/insights/ArtistDistribution";
import { DecadeChart } from "../components/insights/DecadeChart";
import { KpiCard } from "../components/insights/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { RangeToggle } from "../components/RangeToggle";
import { TimeOfDayChart } from "../components/insights/TimeOfDayChart";

/**
 * Insights aggregates derived stats over the user's top tracks/artists for the
 * selected range plus their recent activity.
 *
 * NOTE: Spotify nulls `popularity`, `genres`, and `followers` for apps
 * registered after Nov 2024 (same lockdown that killed audio-features). All
 * stats here are computed from data that *is* available: track durations,
 * album release dates, artist references on tracks, and play timestamps.
 */
export default function Insights() {
  const [range, setRange] = useState<TimeRange>("medium_term");
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [artists, setArtists] = useState<Artist[] | null>(null);
  const [plays, setPlays] = useState<RecentPlay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Range-aware data: refetch when the user toggles the range.
  useEffect(() => {
    let cancelled = false;
    setTracks(null);
    setArtists(null);
    setError(null);
    Promise.all([api.topTracks(range, 100), api.topArtists(range, 100)])
      .then(([tr, ar]) => {
        if (cancelled) return;
        setTracks(tr.items);
        setArtists(ar.items);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  // Recent is range-independent, fetch once.
  useEffect(() => {
    let cancelled = false;
    api
      .recent(50)
      .then((r) => {
        if (!cancelled) setPlays(r.items);
      })
      .catch((_err: unknown) => {
        // Don't blow up the whole page if /recent fails — chart will show empty.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = tracks && artists;
  const featured = ready ? mostFeaturedArtist(tracks!) : null;

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle="Derived stats and distributions across your top tracks, top artists, and recent listens."
      />

      <div className="flex justify-end mb-6">
        <RangeToggle value={range} onChange={setRange} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200/80 mb-6">
          {error}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total minutes"
          value={ready ? formatMinutes(totalDurationMs(tracks!)) : "—"}
          hint={ready ? `across your top ${tracks!.length} tracks` : undefined}
        />
        <KpiCard
          label="Avg track length"
          value={ready ? formatDuration(avgDurationMs(tracks!)) : "—"}
          hint="mean runtime in your top tracks"
        />
        <KpiCard
          label="Most-featured artist"
          value={featured ? featured.name : "—"}
          hint={
            featured
              ? `on ${featured.count} of your top ${tracks!.length} tracks`
              : undefined
          }
        />
        <KpiCard
          label="Top-5 share"
          value={
            ready
              ? `${artistConcentration(tracks!, artists!).toFixed(0)}%`
              : "—"
          }
          hint="of top tracks by your top 5 artists"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Release decades"
          subtitle="When your top tracks came out"
        >
          {ready ? (
            <DecadeChart years={tracks!.map(releaseYear).filter(isNum)} />
          ) : (
            <ChartSkeleton />
          )}
        </ChartCard>

        <ChartCard
          title="Tracks per artist"
          subtitle="Top artists by appearances on your top tracks"
        >
          {ready ? (
            <ArtistDistribution data={artistAppearanceCounts(tracks!)} />
          ) : (
            <ChartSkeleton />
          )}
        </ChartCard>
      </div>

      <div className="mt-4">
        <ChartCard
          title="Time of day"
          subtitle="Plays from your last 50 listens, by local hour"
        >
          {plays ? (
            <TimeOfDayChart playedAtIsos={plays.map((p) => p.played_at)} />
          ) : (
            <ChartSkeleton />
          )}
        </ChartCard>
      </div>
    </>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised p-6">
      <div>
        <h3 className="text-sm font-medium tracking-tight text-zinc-100">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-72 w-full rounded-md bg-surface/60 animate-pulse" />
  );
}

// ── derived stats ──────────────────────────────────────────────────────────

function totalDurationMs(tracks: Track[]): number {
  return tracks.reduce((acc, t) => acc + t.duration_ms, 0);
}

function avgDurationMs(tracks: Track[]): number {
  if (tracks.length === 0) return 0;
  return totalDurationMs(tracks) / tracks.length;
}

function formatMinutes(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h} hr` : `${h} hr ${rem} min`;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Year extracted from album.release_date. Spotify ships this as "YYYY",
 * "YYYY-MM", or "YYYY-MM-DD" — first four chars are always the year.
 */
function releaseYear(track: Track): number | null {
  const raw = track.album.release_date;
  if (!raw) return null;
  const year = parseInt(raw.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

/**
 * Count appearances of each artist across the given tracks. Multi-artist
 * tracks count for every contributing artist. Sorted desc.
 */
function artistAppearanceCounts(
  tracks: Track[],
): { name: string; count: number }[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const t of tracks) {
    for (const a of t.artists) {
      const cur = counts.get(a.id);
      if (cur) cur.count += 1;
      else counts.set(a.id, { name: a.name, count: 1 });
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

function mostFeaturedArtist(
  tracks: Track[],
): { name: string; count: number } | null {
  return artistAppearanceCounts(tracks)[0] ?? null;
}

/**
 * % of top tracks where any contributing artist is in the user's top 5 artists.
 * High = concentrated taste; low = top tracks span a wider artist pool than
 * your top artists alone.
 */
function artistConcentration(tracks: Track[], artists: Artist[]): number {
  if (tracks.length === 0) return 0;
  const top5 = new Set(artists.slice(0, 5).map((a) => a.id));
  if (top5.size === 0) return 0;
  const hits = tracks.filter((t) => t.artists.some((a) => top5.has(a.id))).length;
  return (hits / tracks.length) * 100;
}

function isNum(v: number | null): v is number {
  return typeof v === "number";
}

