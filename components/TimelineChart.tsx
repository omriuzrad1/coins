import { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export type TimelineChartProps = {
  data: { timestamp: number; coins: number; action?: string }[];
};

const COLORS = [
  "#6366f1", "#22d3ee", "#f59e42", "#f43f5e", "#a3e635", "#eab308", "#f472b6", "#7c3aed", "#10b981", "#f87171"
];

function formatMinute(ts: number) {
  const date = new Date(ts * 1000);
  return date.toISOString().slice(11, 16); // HH:mm from ISO string
}

// Map of action codes to user-friendly names (reuse from ReportSummary)
const actionLabels: Record<string, string> = {
  'redeem_bonus': 'Welcome Bonus',
  'buy_gift': 'Gift Sent',
  'grant_widget_bonus': 'Poll Vote'
};
const getFriendlyActionName = (action: string): string => actionLabels[action] || action;

export default function TimelineChart({ data }: TimelineChartProps) {
  // Find all unique actions
  const actions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((row) => {
      if (row.action) set.add(row.action);
    });
    return Array.from(set).sort();
  }, [data]);

  // Aggregate per-minute coins for each action and total
  const timeline = useMemo(() => {
    const map: Record<number, Record<string, number>> = {};
    data.forEach(({ timestamp, coins, action }) => {
      const minute = Math.floor(timestamp / 60) * 60;
      if (!map[minute]) map[minute] = {};
      // Per action
      if (action) map[minute][action] = (map[minute][action] || 0) + coins;
      // Total
      map[minute]["_total"] = (map[minute]["_total"] || 0) + coins;
    });
    // Convert to array
    return Object.entries(map)
      .map(([minute, obj]) => {
        const row: any = { minute: Number(minute), label: formatMinute(Number(minute)) };
        actions.forEach((action) => {
          row[action] = obj[action] || 0;
        });
        row["_total"] = obj["_total"];
        return row;
      })
      .sort((a, b) => a.minute - b.minute);
  }, [data, actions]);

  // Checkbox state for each action and total
  const [visible, setVisible] = useState<{ [key: string]: boolean }>(() => {
    const obj: { [key: string]: boolean } = { _total: true };
    actions.forEach((a) => (obj[a] = true));
    return obj;
  });

  useEffect(() => {
    const expectedKeys = new Set([...actions, "_total"]);
    const currentKeys = new Set(Object.keys(visible));
    let needsUpdate = false;

    // Add new actions to visible
    actions.forEach((a) => {
      if (!(a in visible)) needsUpdate = true;
    });
    if (!("_total" in visible)) needsUpdate = true;

    // Remove keys that no longer exist
    Object.keys(visible).forEach((k) => {
      if (!expectedKeys.has(k)) needsUpdate = true;
    });

    if (needsUpdate) {
      const newVisible: { [key: string]: boolean } = { _total: true };
      actions.forEach((a) => {
        newVisible[a] = true;
      });
      setVisible(newVisible);
    }
  }, [actions]);

  if (!timeline.length) return null;

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <div className="flex flex-wrap gap-4 items-center mb-2 justify-center">
        <span className="font-medium">Show lines:</span>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={visible["_total"]}
            onChange={() => setVisible((prev) => ({ ...prev, _total: !prev._total }))}
          />
          <span className="text-blue-700">Total</span>
        </label>
        {actions.map((action, idx) => (
          <label key={action} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={visible[action]}
              onChange={() => setVisible((prev) => ({ ...prev, [action]: !prev[action] }))}
              style={{ accentColor: COLORS[(idx + 1) % COLORS.length] }}
            />
            <span style={{ color: COLORS[(idx + 1) % COLORS.length] }}>{getFriendlyActionName(action)}</span>
          </label>
        ))}
      </div>
      <h2 className="text-lg font-semibold mb-4 text-center">Coins Given Per Minute (GMT+0)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timeline} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" minTickGap={20} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(_, p) => `Minute: ${p?.[0]?.payload?.label ?? ''} (GMT+0)`}
            formatter={(v: number, name: string) => [v.toLocaleString(), name === '_total' ? 'Total' : getFriendlyActionName(name)]}
          />
          <Legend formatter={(value) => value === '_total' ? 'Total' : getFriendlyActionName(value)} />
          {visible["_total"] && (
            <Line
              type="monotone"
              dataKey="_total"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              name="Total"
            />
          )}
          {actions.map((action, idx) =>
            visible[action] ? (
              <Line
                key={action}
                type="monotone"
                dataKey={action}
                stroke={COLORS[(idx + 1) % COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={getFriendlyActionName(action)}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
