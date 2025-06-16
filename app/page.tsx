'use client';

import FileUploader from '../components/FileUploader';
import ReportSummary from '../components/ReportSummary';
import PieChartView from '../components/PieChartView';
import QuantileView from '../components/QuantileView';
import { useState } from 'react';

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">CoinsDash</h1>
      <FileUploader onData={setData} onError={setError} />
      {error && (
        <div className="mt-4 text-red-600 bg-red-100 p-3 rounded">{error}</div>
      )}
      {data.length > 0 && !error && (
        <div className="mt-8 grid gap-6">
          <ReportSummary data={data} />
          <PieChartView data={data} />
          <QuantileView data={data} />
        </div>
      )}
    </main>
  );
}
