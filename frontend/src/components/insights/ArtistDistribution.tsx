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
 * Horizontal bar chart of "how many of your top tracks each artist appears on".
 * Replaces the popularity-histogram chart since Spotify nulls popularity for
 * new apps. Concentration is the more interesting story anyway.
 *
 * Caps at 8 artists so labels stay legible.
 */
export function ArtistDistribution({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  if (data.length === 0) {
    return <Empty message="No artist data." />;
  }

  const top = data.slice(0, 8);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 6, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#26262b" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: "#26262b" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#71717a"
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={{ stroke: "#26262b" }}
            tickLine={false}
            width={110}
            interval={0}
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
          <Bar dataKey="count" fill="#1DB954" radius={[0, 3, 3, 0]} />
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
