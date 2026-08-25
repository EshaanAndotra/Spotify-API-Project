import type { ReactNode } from "react";

/**
 * Compact stat tile used across the Insights page. Keeps spacing consistent
 * so a row of these all line up without ad-hoc padding tweaks.
 */
export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-zinc-500 truncate">{hint}</div>
      )}
    </div>
  );
}
