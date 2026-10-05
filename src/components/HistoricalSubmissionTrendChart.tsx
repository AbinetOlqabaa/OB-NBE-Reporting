/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Building2,
  Eye,
  Info,
  Layers,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  Dot,
} from 'recharts';
import {
  auditorService,
  type HistoricalReportTrendResult,
  type HistoricalTrendMonthPoint,
} from '../services/auditorService.ts';
import { getAllReports } from '../data/report-registry.ts';
import type { UserSession } from '../types/regulatory.ts';

interface HistoricalSubmissionTrendChartProps {
  currentUser?: UserSession;
  initialReportKey?: string;
  onSelectReportKey?: (reportKey: string) => void;
  onInspectSubmission?: (reportKey: string, month: string) => void;
  compact?: boolean;
}

export const HistoricalSubmissionTrendChart: React.FC<HistoricalSubmissionTrendChartProps> = ({
  currentUser,
  initialReportKey = 'ANARN001',
  onSelectReportKey,
  onInspectSubmission,
  compact = false,
}) => {
  const [selectedReportKey, setSelectedReportKey] = useState<string>(initialReportKey);
  const [selectedFieldCode, setSelectedFieldCode] = useState<string>('');
  const [timeHorizon, setTimeHorizon] = useState<12 | 6 | 3>(12);
  const [showSecondaryMetric, setShowSecondaryMetric] = useState<boolean>(true);
  const [showBenchmarkLine, setShowBenchmarkLine] = useState<boolean>(true);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  const allReports = useMemo(() => getAllReports(), []);

  // Compute 12-month historical trend dataset
  const trendData: HistoricalReportTrendResult = useMemo(() => {
    return auditorService.get12MonthHistoricalTrend(selectedReportKey, selectedFieldCode || undefined);
  }, [selectedReportKey, selectedFieldCode]);

  // Handle report selection change
  const handleReportChange = (newKey: string) => {
    setSelectedReportKey(newKey);
    setSelectedFieldCode('');
    onSelectReportKey?.(newKey);
  };

  // Filter months according to time horizon
  const displayedMonths = useMemo(() => {
    const total = trendData.months.length;
    return trendData.months.slice(total - timeHorizon);
  }, [trendData.months, timeHorizon]);

  // Format monetary currency for ETB (in millions / billions or exact)
  const formatCurrency = (val: number): string => {
    if (Math.abs(val) >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(2)}B ETB`;
    }
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)}M ETB`;
    }
    return `${val.toLocaleString()} ETB`;
  };

  const formatShortCurrency = (val: number): string => {
    if (Math.abs(val) >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(1)}B`;
    }
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${(val / 1_000).toFixed(0)}k`;
    }
    return String(val);
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    let csv = `Report Key,Report Title,Period,Month,Statutory Submission Value (ETB),Secondary Metric (ETB),Variance From 12M Mean,Status,Audit Finding Flag\n`;
    trendData.months.forEach((m) => {
      csv += `"${trendData.reportKey}","${trendData.reportTitle}","${m.period}","${m.monthFull}",${m.primaryValue},${m.secondaryValue},${m.varianceFromMean},"${m.status}","${m.hasFinding ? 'YES' : 'NO'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Oromia_Bank_Auditor_12Month_Trend_${trendData.reportKey}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point: HistoricalTrendMonthPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-2 max-w-xs">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 gap-3">
            <div>
              <div className="font-bold text-slate-200">{point.monthFull}</div>
              <div className="text-[10px] text-slate-400 font-mono">Period: {point.period}</div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                point.status === 'SENT'
                  ? 'bg-purple-900 text-purple-200 border border-purple-700'
                  : 'bg-emerald-900 text-emerald-200 border border-emerald-700'
              }`}
            >
              {point.status}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-ob-indigo-300 font-semibold truncate max-w-[170px]" title={trendData.primaryFieldName}>
                <span className="w-2 h-2 rounded-full bg-ob-indigo-400 shrink-0" />
                <span className="truncate">{trendData.primaryFieldName}:</span>
              </span>
              <span className="font-mono font-bold text-white shrink-0">
                {formatCurrency(point.primaryValue)}
              </span>
            </div>

            {showSecondaryMetric && point.secondaryValue > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-emerald-300 font-semibold truncate max-w-[170px]" title={trendData.secondaryFieldName}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate">{trendData.secondaryFieldName}:</span>
                </span>
                <span className="font-mono font-bold text-slate-200 shrink-0">
                  {formatCurrency(point.secondaryValue)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 text-slate-400 text-[11px] pt-1 border-t border-slate-800">
              <span>Variance vs 12M Mean:</span>
              <span className={`font-mono font-bold ${point.variancePercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {point.variancePercentage >= 0 ? `+${point.variancePercentage}%` : `${point.variancePercentage}%`}
              </span>
            </div>

            {point.hasFinding && (
              <div className="mt-1 p-1.5 bg-rose-950/80 border border-rose-800/80 rounded-lg text-rose-300 text-[10px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Auditor Finding or Verification Variance recorded</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const summary = trendData.summary;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs transition-colors space-y-4">
      {/* 1. Control Header & Report Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-ob-indigo-50 dark:bg-ob-indigo-950/70 border border-ob-indigo-200 dark:border-ob-indigo-800 text-ob-indigo-600 dark:text-ob-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              12-Month Historical Submission Value Trend
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              Recharts Line Visualization
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Supervisory trend tracking across historical filing cycles to identify seasonal growth, cyclical exposure surges, and audit anomalies.
          </p>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Report Key Dropdown */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="auditor-report-select" className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
              Return:
            </label>
            <select
              id="auditor-report-select"
              value={selectedReportKey}
              onChange={(e) => handleReportChange(e.target.value)}
              aria-label="Select report key for 12-month historical trend"
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer max-w-[220px] truncate"
            >
              {allReports.map((r) => (
                <option key={r.ReturnKey} value={r.ReturnKey}>
                  {r.ReturnKey} — {r.Title}
                </option>
              ))}
            </select>
          </div>

          {/* Metric / Field Selector */}
          {trendData.availableNumericFields.length > 1 && (
            <div className="flex items-center gap-1.5">
              <label htmlFor="auditor-field-select" className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                Metric:
              </label>
              <select
                id="auditor-field-select"
                value={selectedFieldCode}
                onChange={(e) => setSelectedFieldCode(e.target.value)}
                aria-label="Select statutory numeric field"
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer max-w-[180px] truncate"
              >
                {trendData.availableNumericFields.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code}: {f.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Horizon Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            {([12, 6, 3] as const).map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => setTimeHorizon(months)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  timeHorizon === months
                    ? 'bg-white dark:bg-slate-700 text-ob-indigo-600 dark:text-ob-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {months}M
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Export 12-Month Submission Trend to CSV"
          >
            <Download className="w-3.5 h-3.5 text-ob-indigo-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Trend Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Latest Submission Value */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Latest Submission
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 truncate">
            {formatCurrency(summary.currentValue)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold">
            {summary.momGrowthRate >= 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{summary.momGrowthRate}% MoM
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {summary.momGrowthRate}% MoM
              </span>
            )}
          </div>
        </div>

        {/* Card 2: 12-Month Mean Average */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            12-Month Mean Average
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 truncate">
            {formatCurrency(summary.twelveMonthMean)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Baseline mean run-rate
          </div>
        </div>

        {/* Card 3: 12-Month High */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            12-Month Peak / High
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            {formatCurrency(summary.twelveMonthHigh.value)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Peak month: {summary.twelveMonthHigh.month}
          </div>
        </div>

        {/* Card 4: 12-Month Low */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            12-Month Low
          </span>
          <div className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 mt-1 truncate">
            {formatCurrency(summary.twelveMonthLow.value)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Low month: {summary.twelveMonthLow.month}
          </div>
        </div>

        {/* Card 5: Annual YoY Growth & Volatility */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            12M Annual Growth
          </span>
          <div className="text-base sm:text-lg font-black text-ob-indigo-600 dark:text-ob-indigo-400 mt-1">
            {summary.twelveMonthAnnualGrowth >= 0 ? `+${summary.twelveMonthAnnualGrowth}%` : `${summary.twelveMonthAnnualGrowth}%`}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Spread σ: {summary.volatilityIndex}%
          </div>
        </div>
      </div>

      {/* 3. Recharts Line Chart Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-ob-indigo-600 dark:text-ob-indigo-400">
              {trendData.reportKey}
            </span>
            <span>•</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {trendData.primaryFieldName}
            </span>
            <span className="text-slate-400 text-[11px] font-normal">
              ({trendData.department} • {trendData.frequency})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={showSecondaryMetric}
                onChange={(e) => setShowSecondaryMetric(e.target.checked)}
                className="rounded text-ob-indigo-600 focus:ring-ob-indigo-500 cursor-pointer"
              />
              <span>Secondary Metric</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={showBenchmarkLine}
                onChange={(e) => setShowBenchmarkLine(e.target.checked)}
                className="rounded text-ob-indigo-600 focus:ring-ob-indigo-500 cursor-pointer"
              />
              <span>12M Mean Line</span>
            </label>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayedMonths}
              margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.18} />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                dy={6}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatShortCurrency(val)}
                dx={-4}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
              />

              {showBenchmarkLine && (
                <ReferenceLine
                  y={summary.twelveMonthMean}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{
                    value: `12M Mean: ${formatShortCurrency(summary.twelveMonthMean)}`,
                    fill: '#64748b',
                    fontSize: 10,
                    position: 'right',
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey="primaryValue"
                name={trendData.primaryFieldName}
                stroke="#6366f1"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.hasFinding) {
                    return (
                      <circle
                        key={payload.month}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#f43f5e"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }
                  return (
                    <circle
                      key={payload.month}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill="#6366f1"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
              />

              {showSecondaryMetric && (
                <Line
                  type="monotone"
                  dataKey="secondaryValue"
                  name={trendData.secondaryFieldName}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: '#10b981' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Table Toggle & Inspection Details */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            className="flex items-center gap-1.5 text-xs font-bold text-ob-indigo-600 dark:text-ob-indigo-400 hover:underline cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{showDataTable ? 'Hide Monthly Ledger Table' : 'Show 12-Month Detailed Ledger Table'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDataTable ? 'rotate-180' : ''}`} />
          </button>

          <span className="text-[11px] text-slate-400">
            Red markers on trend line designate recorded audit findings or statutory variances.
          </span>
        </div>

        {showDataTable && (
          <div className="mt-3 overflow-x-auto min-w-full touch-scroll-x">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 font-semibold">
                  <th className="py-2 px-3">Reporting Period</th>
                  <th className="py-2 px-3">Month</th>
                  <th className="py-2 px-3 text-right">Submission Value (ETB)</th>
                  <th className="py-2 px-3 text-right">Variance vs 12M Mean</th>
                  <th className="py-2 px-3 text-center">Filing Status</th>
                  <th className="py-2 px-3 text-center">Audit Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedMonths.map((m) => (
                  <tr key={m.period} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 font-mono font-bold text-ob-indigo-700 dark:text-ob-indigo-400">
                      {m.period}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {m.monthFull}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-right text-slate-900 dark:text-white">
                      {formatCurrency(m.primaryValue)}
                    </td>
                    <td className="py-2 px-3 font-mono text-right">
                      <span className={`font-semibold ${m.variancePercentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {m.variancePercentage >= 0 ? `+${m.variancePercentage}%` : `${m.variancePercentage}%`}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {m.hasFinding ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 inline-flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Variance Flagged</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
