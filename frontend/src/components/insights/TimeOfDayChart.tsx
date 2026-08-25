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
 * 24-hour distribution of plays from the user's last 50 plays (Spotify caps
 * /recently-played at 50). Bucketed by local hour, not UTC, so "you listen
 * at 11pm" tracks the user's actual perception.
 */
export function TimeOfDayChart({ playedAtIsos }: { playedAtIsos: string[] }) {
  if (playedAtIsos.length === 0) {
    return <Empty message="No recent plays." />;
  }

  const buckets = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: formatHour(h),
    count: 0,
  }));
  for (const iso of playedAtIsos) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    buckets[d.getHours()].count += 1;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={buckets} margin={{ top: 10, right: 10, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#26262b" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#71717a"
            tick={{ fontSize: 10 }}
            axisLine={{ stroke: "#26262b" }}
            tickLine={false}
            interval={2}
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
              `${Number(value)} play${Number(value) === 1 ? "" : "s"}`,
              "",
            ]}
          />
          <Bar dataKey="count" fill="#1DB954" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatHour(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function Empty({ message }: { message: string }) {
  return (
    <div className="h-72 flex items-center justify-center text-sm text-zinc-500">
      {message}
    </div>
  );
}
