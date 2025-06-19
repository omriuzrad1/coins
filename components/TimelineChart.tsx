import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export type TimelineChartProps = {
  data: { timestamp: number; coins: number }[];
};

// Helper to format timestamp as HH:mm (GMT+0)
function formatMinute(ts: number) {
  const date = new Date(ts * 1000);
  return date.toISOString().slice(11, 16); // HH:mm from ISO string
}

export default function TimelineChart({ data }: TimelineChartProps) {
  // Aggregate coins per minute (GMT+0)
  const timeline = useMemo(() => {
    const perMinute: Record<string, number> = {};
    data.forEach(({ timestamp, coins }) => {
      // Round down to the minute
      const minute = Math.floor(timestamp / 60) * 60;
      perMinute[minute] = (perMinute[minute] || 0) + coins;
    });
    // Convert to sorted array for chart
    return Object.entries(perMinute)
      .map(([minute, coins]) => ({
        minute: Number(minute),
        coins,
        label: formatMinute(Number(minute)),
      }))
      .sort((a, b) => a.minute - b.minute);
  }, [data]);

  if (!timeline.length) return null;

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4 text-center">Coins Given Per Minute (GMT+0)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timeline} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" minTickGap={20} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip labelFormatter={(_, p) => `Minute: ${p?.[0]?.payload?.label ?? ''} (GMT+0)`} formatter={(v: number) => v.toLocaleString()} />
          <Line type="monotone" dataKey="coins" stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
