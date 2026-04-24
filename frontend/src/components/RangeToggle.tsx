import type { TimeRange } from "../api/client";

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "short_term", label: "Last 4 weeks" },
  { value: "medium_term", label: "Last 6 months" },
  { value: "long_term", label: "All time" },
];

/**
 * Three-way pill toggle for Spotify's time_range windows.
 * Active pill is Spotify green; inactive pills are muted zinc.
 */
export function RangeToggle({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Time range"
      className="inline-flex rounded-full border border-surface-border bg-surface p-1"
    >
      {RANGES.map((r) => {
        const active = r.value === value;
        return (
          <button
            key={r.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r.value)}
            className={
              "px-4 py-1.5 text-sm rounded-full " +
              (active
                ? "bg-spotify text-black font-medium"
                : "text-zinc-400 hover:text-zinc-200")
            }
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
