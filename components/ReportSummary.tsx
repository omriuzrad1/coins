import { Card } from "@/components/ui/card";

type ReportSummaryProps = {
  data: { pk: string; coins: number; action: string }[];
  showWelcomeBonus: boolean;
  countries?: string[];
  sources?: { name: string; originalIndex: number }[];
  onCountryClick?: (index: number) => void;
};

// Map of action codes to user-friendly names
const actionLabels: Record<string, string> = {
  'redeem_bonus': 'Welcome Bonus',
  'buy_gift': 'Gift Sent',
  'grant_widget_bonus': 'Poll Vote'
};

// Function to get friendly name for an action
const getFriendlyActionName = (action: string): string => {
  return actionLabels[action] || action; // Use the mapping or the original if not found
};

export default function ReportSummary({ data, showWelcomeBonus, countries, sources, onCountryClick }: ReportSummaryProps) {
  // Filter out welcome bonus data if needed
  const filteredData = showWelcomeBonus 
    ? data 
    : data.filter(row => row.action !== 'redeem_bonus');
  
  // Calculate total unique users and total coins
  const uniqueUsers = new Set(filteredData.map((row) => row.pk)).size;
  const totalCoins = filteredData.reduce((sum, row) => sum + (Number(row.coins) || 0), 0);
  
  // Calculate average coins per unique user
  const averageCoinsPerUser = uniqueUsers > 0 ? Math.round((totalCoins / uniqueUsers) * 100) / 100 : 0;
  
  // Group data by action
  const actionGroups: Record<string, { pk: string; coins: number; action: string }[]> = {};
  filteredData.forEach(row => {
    if (!actionGroups[row.action]) {
      actionGroups[row.action] = [];
    }
    actionGroups[row.action].push(row);
  });

  // Calculate unique users and total coins per action
  const actionStats = Object.entries(actionGroups).map(([action, rows]) => {
    const uniqueUsersForAction = new Set(rows.map(row => row.pk)).size;
    const totalCoinsForAction = rows.reduce((sum, row) => sum + (Number(row.coins) || 0), 0);
    const totalRowsForAction = rows.length;
    const avgCoinsPerUser = uniqueUsersForAction > 0 ? Math.round((totalCoinsForAction / uniqueUsersForAction) * 100) / 100 : 0;
    return {
      action,
      uniqueUsers: uniqueUsersForAction,
      totalCoins: totalCoinsForAction,
      totalRows: totalRowsForAction,
      avgCoinsPerUser
    };
  }).sort((a, b) => b.totalCoins - a.totalCoins); // Sort by total coins descending

  return (
    <div className="space-y-6">
      {/* If sources are provided, render clickable country list */}
      {sources && sources.length > 0 && onCountryClick ? (
        <div className="mb-4 p-3 bg-blue-50 rounded text-blue-900 text-sm">
          <span className="font-semibold">Countries:</span>{' '}
          {sources.map((src, i) => (
            <button
              key={src.originalIndex}
              className="underline text-blue-700 hover:text-blue-900 mx-1"
              onClick={() => onCountryClick(src.originalIndex)}
              type="button"
            >
              {src.name}
            </button>
          ))}
        </div>
      ) : countries && countries.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded text-blue-900 text-sm">
          <span className="font-semibold">Countries:</span> {countries.join(', ')}
        </div>
      )}
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 rounded-xl shadow bg-white flex flex-col items-center">
          <div className="text-2xl font-bold">{uniqueUsers.toLocaleString()}</div>
          <div className="text-gray-600 mt-1">Unique Users</div>
        </Card>
        <Card className="p-6 rounded-xl shadow bg-white flex flex-col items-center">
          <div className="text-2xl font-bold">{averageCoinsPerUser.toLocaleString()}</div>
          <div className="text-gray-600 mt-1">Avg. Coins/User</div>
        </Card>
        <Card className="p-6 rounded-xl shadow bg-white flex flex-col items-center">
          <div className="text-2xl font-bold">{totalCoins.toLocaleString()}</div>
          <div className="text-gray-600 mt-1">Total Coins</div>
        </Card>
      </div>
      
      {/* Action breakdown */}
      <Card className="p-6 rounded-xl shadow bg-white">
        <h3 className="text-lg font-semibold mb-4">Action Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Action</th>
                <th className="text-right py-2">Unique Users</th>
                <th className="text-right py-2">Total Coins</th>
                <th className="text-right py-2">Avg. Coins/User</th>
                <th className="text-right py-2">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {actionStats.map((stat) => (
                <tr key={stat.action} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2">{getFriendlyActionName(stat.action)}</td>
                  <td className="text-right py-2">{stat.uniqueUsers.toLocaleString()}</td>
                  <td className="text-right py-2">{stat.totalCoins.toLocaleString()}</td>
                  <td className="text-right py-2">{stat.avgCoinsPerUser.toLocaleString()}</td>
                  <td className="text-right py-2">{stat.totalRows.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
