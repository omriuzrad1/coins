import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type PieChartViewProps = {
  data: { pk: string; coins: number; action: string }[];
  showWelcomeBonus: boolean;
};

// Map of action codes to user-friendly names - keep in sync with ReportSummary.tsx
const actionLabels: Record<string, string> = {
  'redeem_bonus': 'Welcome Bonus',
  'buy_gift': 'Gift Sent',
  'grant_widget_bonus': 'Poll Vote'
};

// Function to get friendly name for an action
const getFriendlyActionName = (action: string): string => {
  return actionLabels[action] || action; // Use the mapping or the original if not found
};

const COLORS = [
  '#6366f1', '#22d3ee', '#f59e42', '#f43f5e', '#a3e635', '#eab308', '#f472b6', '#7c3aed', '#10b981', '#f87171'
];

export default function PieChartView({ data, showWelcomeBonus }: PieChartViewProps) {
  // Filter out welcome bonus data if needed
  const filteredData = showWelcomeBonus 
    ? data 
    : data.filter(row => row.action !== 'redeem_bonus');
    
  // Aggregate coins per action
  const actionMap = new Map<string, number>();
  filteredData.forEach(row => {
    actionMap.set(row.action, (actionMap.get(row.action) || 0) + (Number(row.coins) || 0));
  });
  const chartData = Array.from(actionMap.entries()).map(([action, coins]) => ({
    action,
    actionName: getFriendlyActionName(action),
    coins
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-center">Coin Distribution by Action</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="coins"
            nameKey="actionName"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#6366f1"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
