'use client';

import FileUploader from '../components/FileUploader';
import ReportSummary from '../components/ReportSummary';
import PieChartView from '../components/PieChartView';
import QuantileView from '../components/QuantileView';
import TimelineChart from '../components/TimelineChart';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

// Define the type for a report
type Report = {
  fileName: string;
  data: any[];
  countries?: string[];
  sources?: { name: string; originalIndex: number }[];
  isSummary?: boolean;
  partOfSummary?: boolean;
};

export default function Home() {
  // Track hidden tab indices
  const [hiddenIndices, setHiddenIndices] = useState<Set<number>>(new Set());
  // State for multiple reports
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReportIndex, setActiveReportIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState<boolean>(true); // State to control welcome bonus visibility

  // Handle data from multiple files
  const handleFileData = (fileResults: { fileName: string, data: any[] }[]) => {
    if (fileResults.length === 0) return;
    
    setReports(prevReports => {
      const newReports = [...prevReports, ...fileResults];
      // Set the last added report as active
      setActiveReportIndex(newReports.length - 1);
      return newReports;
    });
  };

  // Handle error from file upload
  const handleError = (errorMessage: string | null) => {
    setError(errorMessage);
  };

  // Generate a summary report from all loaded reports
  const handleGenerateSummary = () => {
    if (reports.length < 2) return;

    // Combine data from all reports
    const combinedData = reports.flatMap(report => report.data);

    // Find the longest common prefix among all tab names
    const getCommonPrefix = (strings: string[]) => {
      if (!strings.length) return '';
      let prefix = strings[0];
      for (let i = 1; i < strings.length; i++) {
        while (strings[i].indexOf(prefix) !== 0 && prefix.length > 0) {
          prefix = prefix.slice(0, -1);
        }
        if (prefix === '') break;
      }
      return prefix.trim();
    };
    const tabNames = reports.map(r => r.fileName);
    const commonPrefix = getCommonPrefix(tabNames);
    const trimmedPrefix = commonPrefix.replace(/\s+$/, '');
    const countries = tabNames.map(name => name.slice(trimmedPrefix.length).trim()).filter(Boolean);

    // Store sources (name=country/region suffix, originalIndex) for summary
    const sources = tabNames.map((name, idx) => ({ name: name.slice(trimmedPrefix.length).trim(), originalIndex: idx }));

    // Hide all original tabs
    setHiddenIndices(new Set(sources.map(s => s.originalIndex)));

    // Mark all source reports as partOfSummary
    setReports(prevReports => {
      const newReports = prevReports.map((r, i) => sources.some(s => s.originalIndex === i) ? { ...r, partOfSummary: true } : r);
      // Create a new summary report
      const summaryReport = {
        fileName: trimmedPrefix || "Combined Summary",
        data: combinedData,
        countries,
        sources,
        isSummary: true
      };
      const finalReports = [...newReports, summaryReport];
      setActiveReportIndex(finalReports.length - 1);
      return finalReports;
    });
  };

  
  // Get the active report data
  const activeReport = reports.length > 0 ? reports[activeReportIndex] : null;

  // Prepare timeline data for the active report
  const timelineData = activeReport?.data
    ?.filter(row => {
      if (!row.timestamp || isNaN(Number(row.timestamp)) || row.coins === undefined) return false;
      if (!showWelcomeBonus && row.action === 'redeem_bonus') return false;
      return true;
    })
    .map(row => ({ timestamp: Number(row.timestamp), coins: Number(row.coins), action: row.action })) ?? [];


  // Handler to unhide a report tab by index
  const handleShowReport = (index: number) => {
    setHiddenIndices(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setActiveReportIndex(index);
  };

  // Handler to hide a report and switch to summary
  const handleHideReport = () => {
    // Hide the current tab and switch to the summary tab
    setHiddenIndices(prev => {
      const newSet = new Set(prev);
      newSet.add(activeReportIndex);
      // Find the summary index
      const summaryIdx = reports.findIndex(r => r.isSummary);
      if (summaryIdx !== -1) {
        setActiveReportIndex(summaryIdx);
      } else {
        setActiveReportIndex(0);
      }
      return newSet;
    });
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">CoinsDash</h1>
      <FileUploader onData={handleFileData} onError={handleError} />
      
      {error && (
        <div className="mt-4 text-red-600 bg-red-100 p-3 rounded">{error}</div>
      )}
      
      {reports.length > 0 && !error && (
        <>
          {/* Report tabs and summary button */}
          <div className="mt-6 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
            {reports.map((report, index) => (
              (hiddenIndices.has(index) && !report.isSummary) ? null : (
                <button
                  key={index}
                  onClick={() => setActiveReportIndex(index)}
                  className={`px-4 py-2 rounded-t-lg transition-colors ${
                    index === activeReportIndex
                      ? 'bg-white text-blue-600 border border-gray-300 border-b-0 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {report.fileName}
                </button>
              )
            ))}
            </div>
            
            {/* Summary button - only show when 2 or more reports are loaded */}
            {reports.length >= 2 && (
              <button
                onClick={handleGenerateSummary}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate Summary
              </button>
            )}
          </div>
          
          {/* Active report content */}
          {activeReport && (
            <Card className="border rounded-tl-none p-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Report: {activeReport.fileName}</h2>
                {activeReport.partOfSummary ? (
                  <button
                    onClick={handleHideReport}
                    className="text-yellow-600 hover:text-yellow-800 text-sm"
                  >
                    Hide Report
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const newReports = reports.filter((_, i) => i !== activeReportIndex);
                      setReports(newReports);
                      setActiveReportIndex(Math.min(activeReportIndex, newReports.length - 1));
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove Report
                  </button>
                )}
              </div>
              
              <div className="flex items-center mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWelcomeBonus}
                    onChange={(e) => setShowWelcomeBonus(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Welcome Bonus</span>
                </label>
              </div>
              <div className="grid gap-6">
                <ReportSummary 
                  data={activeReport.data} 
                  showWelcomeBonus={showWelcomeBonus} 
                  countries={activeReport.countries}
                  sources={activeReport.sources}
                  onCountryClick={handleShowReport}
                />
                <PieChartView data={activeReport.data} showWelcomeBonus={showWelcomeBonus} />
                <QuantileView data={activeReport.data} showWelcomeBonus={showWelcomeBonus} />
                {timelineData.length > 0 && <TimelineChart data={timelineData} />}
              </div>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
