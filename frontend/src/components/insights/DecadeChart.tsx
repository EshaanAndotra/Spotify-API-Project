import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Releases-by-decade for the user's top tracks.
 *
 * Built from album.release_date ("YYYY", "YYYY-MM", or "YYYY-MM-DD"). Tracks
 * with no release year are dropped silently — Spotify rarely omits this field
 * and showing an "unknown" bucket would just be noise.
 */
export function DecadeChart({ years }: { years: number[] }) {
  if (years.length === 0) {
    return <Empty message="No release-year data." />;
  }

  // Bucket into decades. Build dense range so the gaps between active decades
  // show up — a sparse {2010s: 5, 2020s: 30} chart hides the absence of 90s.
  const decades = years.map((y) => Math.floor(y / 10) * 10);
  const minDec = Math.min(...decades);
  const maxDec = Math.max(...decades);

  const buckets: { label: string; count: number }[] = [];
  for (let d = minDec; d <= maxDec; d += 10) {
    buckets.push({ label: `${d}s`, count: 0 });
  }
  for (const d of decades) {
    const idx = (d - minDec) / 10;
    buckets[idx].count += 1;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={buckets} margin={{ top: 10, right: 10, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#26262b" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: "#26262b" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: "#26262b" }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#17171a",
              border: "1px solid #26262b",
              borderRadius: 8,
              fontSize: 12,
            }}
            itemStyle={{ color: "#e4e4e7" }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value: unknown) => [
              `${Number(value)} track${Number(value) === 1 ? "" : "s"}`,
              "",
            ]}
          />
          <Bar dataKey="count" fill="#1DB954" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="h-72 flex items-center justify-center text-sm text-zinc-500">
      {message}
    </div>
  );
}
