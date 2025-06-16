import { Card } from "@/components/ui/card";

type QuantileViewProps = {
  data: { pk: string; coins: number; action: string }[];
};

export default function QuantileView({ data }: QuantileViewProps) {
  // First, calculate total coins per user
  const userCoins = new Map<string, number>();
  
  data.forEach(row => {
    const userId = row.pk;
    const coins = Number(row.coins) || 0;
    userCoins.set(userId, (userCoins.get(userId) || 0) + coins);
  });
  
  // Get total coins in the system
  const totalCoinsInSystem = data.reduce((sum, row) => sum + (Number(row.coins) || 0), 0);
  
  // Convert user coins to array of {userId, coins} objects for sorting
  const userCoinEntries = Array.from(userCoins.entries()).map(([userId, coins]) => ({ userId, coins }));
  
  // Sort by coin amount (ascending)
  userCoinEntries.sort((a, b) => a.coins - b.coins);
  
  // Calculate running sum to find percentile thresholds based on total coins
  let runningSum = 0;
  const percentileThresholds = {
    p25: 0,
    p50: 0,
    p70: 0,
    p90: 0
  };
  
  // Find the coin value at each percentile of total coins
  for (const entry of userCoinEntries) {
    runningSum += entry.coins;
    const percentOfTotal = (runningSum / totalCoinsInSystem) * 100;
    
    if (percentileThresholds.p25 === 0 && percentOfTotal >= 25) {
      percentileThresholds.p25 = entry.coins;
    }
    if (percentileThresholds.p50 === 0 && percentOfTotal >= 50) {
      percentileThresholds.p50 = entry.coins;
    }
    if (percentileThresholds.p70 === 0 && percentOfTotal >= 70) {
      percentileThresholds.p70 = entry.coins;
    }
    if (percentileThresholds.p90 === 0 && percentOfTotal >= 90) {
      percentileThresholds.p90 = entry.coins;
    }
  }
  
  // Find min and max coins for each quantile range
  const coinRanges = {
    q1: { min: 0, max: percentileThresholds.p25 },
    q2: { min: percentileThresholds.p25, max: percentileThresholds.p50 },
    q3: { min: percentileThresholds.p50, max: percentileThresholds.p70 },
    q4: { min: percentileThresholds.p70, max: percentileThresholds.p90 },
    q5: { min: percentileThresholds.p90, max: Math.max(...userCoinEntries.map(entry => entry.coins)) }
  };
  
  // Adjust ranges for edge cases where thresholds are the same
  if (percentileThresholds.p25 === percentileThresholds.p50) {
    coinRanges.q2.min = percentileThresholds.p25;
    coinRanges.q2.max = percentileThresholds.p25; // Same value
  }
  
  if (percentileThresholds.p50 === percentileThresholds.p70) {
    coinRanges.q3.min = percentileThresholds.p50;
    coinRanges.q3.max = percentileThresholds.p50; // Same value
  }
  
  if (percentileThresholds.p70 === percentileThresholds.p90) {
    coinRanges.q4.min = percentileThresholds.p70;
    coinRanges.q4.max = percentileThresholds.p70; // Same value
  }
  
  // Group users into quantiles based on the thresholds
  const usersInQuantile = {
    q1: userCoinEntries.filter(entry => entry.coins <= percentileThresholds.p25),
    q2: userCoinEntries.filter(entry => entry.coins > percentileThresholds.p25 && entry.coins <= percentileThresholds.p50),
    q3: userCoinEntries.filter(entry => entry.coins > percentileThresholds.p50 && entry.coins <= percentileThresholds.p70),
    q4: userCoinEntries.filter(entry => entry.coins > percentileThresholds.p70 && entry.coins <= percentileThresholds.p90),
    q5: userCoinEntries.filter(entry => entry.coins > percentileThresholds.p90)
  };
  
  // Calculate user counts and coin sums for each quantile
  const userCountsByQuantile = {
    q1: usersInQuantile.q1.length,
    q2: usersInQuantile.q2.length,
    q3: usersInQuantile.q3.length,
    q4: usersInQuantile.q4.length,
    q5: usersInQuantile.q5.length
  };
  
  const coinsByQuantile = {
    q1: usersInQuantile.q1.reduce((sum, entry) => sum + entry.coins, 0),
    q2: usersInQuantile.q2.reduce((sum, entry) => sum + entry.coins, 0),
    q3: usersInQuantile.q3.reduce((sum, entry) => sum + entry.coins, 0),
    q4: usersInQuantile.q4.reduce((sum, entry) => sum + entry.coins, 0),
    q5: usersInQuantile.q5.reduce((sum, entry) => sum + entry.coins, 0)
  };
  
  // For display purposes, use the thresholds
  const quantiles = {
    p25: percentileThresholds.p25,
    p50: percentileThresholds.p50,
    p70: percentileThresholds.p70,
    p90: percentileThresholds.p90
  };
  
  return (
    <Card className="p-6 rounded-xl shadow bg-white">
      <h3 className="text-lg font-semibold mb-4">User Coin Distribution</h3>
      
      <div className="space-y-6">
        {/* Quantile cutoffs */}
        <div>
          <h4 className="text-md font-medium mb-2">Coin Quantile Cutoffs (By Total Coin Value)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">25% of Total Coins</div>
              <div className="text-lg font-medium">≤ {quantiles.p25.toLocaleString()} coins</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">50% of Total Coins</div>
              <div className="text-lg font-medium">≤ {quantiles.p50.toLocaleString()} coins</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">70% of Total Coins</div>
              <div className="text-lg font-medium">≤ {quantiles.p70.toLocaleString()} coins</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">90% of Total Coins</div>
              <div className="text-lg font-medium">≤ {quantiles.p90.toLocaleString()} coins</div>
            </div>
          </div>
        </div>
        
        {/* Quantile distribution */}
        <div>
          <h4 className="text-md font-medium mb-2">User Distribution by Coin Value Quantile</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Quantile</th>
                  <th className="text-right py-2">Coin Range</th>
                  <th className="text-right py-2">Users</th>
                  <th className="text-right py-2">% of Users</th>
                  <th className="text-right py-2">Total Coins</th>
                  <th className="text-right py-2">% of Coins</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2">0-25%</td>
                  <td className="text-right py-2">{coinRanges.q1.min.toLocaleString()}-{coinRanges.q1.max.toLocaleString()}</td>
                  <td className="text-right py-2">{userCountsByQuantile.q1.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(userCountsByQuantile.q1 / userCoinEntries.length * 100)}%</td>
                  <td className="text-right py-2">{coinsByQuantile.q1.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(coinsByQuantile.q1 / data.reduce((sum, row) => sum + (Number(row.coins) || 0), 0) * 100)}%</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2">25-50%</td>
                  <td className="text-right py-2">
                    {coinRanges.q2.min === coinRanges.q2.max ? 
                      coinRanges.q2.min.toLocaleString() : 
                      `${(coinRanges.q2.min + 0.01).toLocaleString()}-${coinRanges.q2.max.toLocaleString()}`
                    }
                  </td>
                  <td className="text-right py-2">{userCountsByQuantile.q2.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(userCountsByQuantile.q2 / userCoinEntries.length * 100)}%</td>
                  <td className="text-right py-2">{coinsByQuantile.q2.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(coinsByQuantile.q2 / data.reduce((sum, row) => sum + (Number(row.coins) || 0), 0) * 100)}%</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2">50-70%</td>
                  <td className="text-right py-2">
                    {coinRanges.q3.min === coinRanges.q3.max ? 
                      coinRanges.q3.min.toLocaleString() : 
                      `${(coinRanges.q3.min + 0.01).toLocaleString()}-${coinRanges.q3.max.toLocaleString()}`
                    }
                  </td>
                  <td className="text-right py-2">{userCountsByQuantile.q3.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(userCountsByQuantile.q3 / userCoinEntries.length * 100)}%</td>
                  <td className="text-right py-2">{coinsByQuantile.q3.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(coinsByQuantile.q3 / data.reduce((sum, row) => sum + (Number(row.coins) || 0), 0) * 100)}%</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2">70-90%</td>
                  <td className="text-right py-2">
                    {coinRanges.q4.min === coinRanges.q4.max ? 
                      coinRanges.q4.min.toLocaleString() : 
                      `${(coinRanges.q4.min + 0.01).toLocaleString()}-${coinRanges.q4.max.toLocaleString()}`
                    }
                  </td>
                  <td className="text-right py-2">{userCountsByQuantile.q4.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(userCountsByQuantile.q4 / userCoinEntries.length * 100)}%</td>
                  <td className="text-right py-2">{coinsByQuantile.q4.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(coinsByQuantile.q4 / data.reduce((sum, row) => sum + (Number(row.coins) || 0), 0) * 100)}%</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2">90-100%</td>
                  <td className="text-right py-2">&gt; {coinRanges.q5.min.toLocaleString()}</td>
                  <td className="text-right py-2">{userCountsByQuantile.q5.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(userCountsByQuantile.q5 / userCoinEntries.length * 100)}%</td>
                  <td className="text-right py-2">{coinsByQuantile.q5.toLocaleString()}</td>
                  <td className="text-right py-2">{Math.round(coinsByQuantile.q5 / data.reduce((sum, row) => sum + (Number(row.coins) || 0), 0) * 100)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Key insights */}
        <div>
          <h4 className="text-md font-medium mb-2">Key Insights</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Users with ≤ {quantiles.p25.toLocaleString()} coins hold 25% of all coins</li>
            <li>Users with ≤ {quantiles.p50.toLocaleString()} coins hold 50% of all coins</li>
            <li>Users with ≤ {quantiles.p70.toLocaleString()} coins hold 70% of all coins</li>
            <li>Users with ≤ {quantiles.p90.toLocaleString()} coins hold 90% of all coins</li>
            <li>Users with &gt; {quantiles.p90.toLocaleString()} coins hold 10% of all coins</li>
            <li>{userCountsByQuantile.q5.toLocaleString()} users ({Math.round(userCountsByQuantile.q5 / userCoinEntries.length * 100)}% of users) hold 10% of all coins</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
