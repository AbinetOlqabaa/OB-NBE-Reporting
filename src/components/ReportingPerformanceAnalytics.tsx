/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Send,
  Building2,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Check,
  ChevronRight,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  reportingAnalyticsService,
  type ReportingAnalyticsData,
  type AnalyticsFilter,
} from '../services/reportingAnalyticsService.ts';
import { departmentService } from '../services/departmentService.ts';
import type { UserSession } from '../types/regulatory.ts';

interface ReportingPerformanceAnalyticsProps {
  currentUser: UserSession;
  compact?: boolean;
  onViewAllSubmissions?: () => void;
  onOpenReport?: (reportKey: string) => void;
}

export const ReportingPerformanceAnalytics: React.FC<ReportingPerformanceAnalyticsProps> = ({
  currentUser,
  compact = false,
  onViewAllSubmissions,
  onOpenReport,
}) => {
  const [timeRange, setTimeRange] = useState<number>(30);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedFreq, setSelectedFreq] = useState<string>('ALL');
  const [data, setData] = useState<ReportingAnalyticsData>(() =>
    reportingAnalyticsService.getAnalytics({ timeRangeDays: 30 })
  );
  const [activeChartTab, setActiveChartTab] = useState<'VOLUME' | 'TURNAROUND' | 'STATUS' | 'DEPARTMENTS'>('VOLUME');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [departments, setDepartments] = useState(() => departmentService.getAll());

  // Subscribe to live submission updates
  useEffect(() => {
    const unsub = reportingAnalyticsService.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, [timeRange, selectedDept, selectedFreq]);

  const refreshData = () => {
    setIsRefreshing(true);
    try {
      const analytics = reportingAnalyticsService.getAnalytics({
        timeRangeDays: timeRange,
        department: selectedDept,
        frequency: selectedFreq,
      });
      setData(analytics);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    refreshData();
  }, [timeRange, selectedDept, selectedFreq]);

  // CSV Export Handler
  const handleExportCsv = () => {
    const csv = reportingAnalyticsService.generateCsvExport(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Oromia_Bank_NBE_Reporting_Performance_Analytics_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON Export Handler
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Oromia_Bank_NBE_Analytics_Dataset_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const kpis = data.kpis;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <div className="font-bold text-slate-200 mb-1 border-b border-slate-700/80 pb-1">{label}</div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-mono font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Compact Widget Mode for Dashboard Embedding
  if (compact) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs transition-colors mb-3">
        {/* Compact Header */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ob-indigo-50 dark:bg-ob-indigo-950 text-ob-indigo-700 dark:text-ob-indigo-300 flex items-center justify-center border border-ob-indigo-200 dark:border-ob-indigo-800 shrink-0">
              <BarChart3 className="w-4 h-4 text-ob-indigo-600 dark:text-ob-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Reporting Performance Analytics
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">· Last {timeRange} Days</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Statutory submission volume trends, 4-eyes approval turnaround & SLA compliance.
              </p>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveChartTab('VOLUME')}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeChartTab === 'VOLUME'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Volume Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('TURNAROUND')}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeChartTab === 'TURNAROUND'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Approval Times
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('STATUS')}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeChartTab === 'STATUS'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pipeline
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTimeRange(days)}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    timeRange === days
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Refresh Analytics Dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-ob-indigo-600' : ''}`} />
            </button>

            {/* Expand / Full View Link */}
            {onViewAllSubmissions && (
              <button
                type="button"
                onClick={onViewAllSubmissions}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-ob-indigo-700 dark:text-ob-indigo-300 bg-ob-indigo-50 dark:bg-ob-indigo-950/70 hover:bg-ob-indigo-100 dark:hover:bg-ob-indigo-900 border border-ob-indigo-200 dark:border-ob-indigo-800 rounded-lg transition-colors cursor-pointer"
                title="Expand to Full Analytics Suite"
              >
                <span>Full Suite</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Compact KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3">
          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 rounded-lg p-2">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total Volume</div>
            <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {kpis.totalSubmissions30d}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">{kpis.totalDepartmentsReporting} Depts Active</div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 rounded-lg p-2">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Avg Turnaround</div>
            <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-0.5">
              <span>{kpis.avgTurnaroundHours}</span>
              <span className="text-[10px] font-normal text-slate-500">hrs</span>
            </div>
            <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">Target: 24h SLA</div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 rounded-lg p-2">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">SLA Compliance</div>
            <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
              {kpis.slaComplianceRate}%
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">&le; 24h Statutory Review</div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 rounded-lg p-2">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">First-Pass Rate</div>
            <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {kpis.firstPassRate}%
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">Zero-Correction Ratio</div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 rounded-lg p-2 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">In-Flight Queue</div>
            <div className="text-base font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
              {kpis.activeInFlight}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">{kpis.pendingCheckerCount} Pend · {kpis.needsCorrectionCount} Edit</div>
          </div>
        </div>

        {/* Compact Chart Area */}
        <div className="h-60 sm:h-64 w-full">
          {activeChartTab === 'VOLUME' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.dailyTrends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="compactColorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="compactColorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="compactColorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="compactColorTransmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={timeRange > 30 ? 6 : timeRange > 14 ? 3 : 1}
                />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Drafts Created"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#compactColorCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  name="Submitted to Checker"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#compactColorSubmitted)"
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  name="Approved by Checker"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#compactColorApproved)"
                />
                <Area
                  type="monotone"
                  dataKey="transmitted"
                  name="Delivered to NBE"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#compactColorTransmitted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === 'TURNAROUND' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.dailyTrends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={timeRange > 30 ? 6 : timeRange > 14 ? 3 : 1}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  unit="h"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={24}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  label={{
                    value: '24h Statutory SLA Target',
                    position: 'top',
                    fill: '#e11d48',
                    fontSize: 9,
                    fontWeight: 'bold',
                  }}
                />
                <Bar
                  dataKey="avgTurnaroundHours"
                  name="Avg Approval Time (Hours)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === 'STATUS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 h-full items-center gap-4">
              <div className="h-full relative min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell key={`compact-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} Returns`, name]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {kpis.totalSubmissions30d}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Returns</span>
                </div>
              </div>

              <div className="space-y-1.5 pr-2">
                {data.statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                      <span className="text-slate-400 text-[10px]">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compact Footnote */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
          <span>Dual-control 4-eyes principle enforced under NBE Banking Supervision Directive BSD/03/2020.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="text-xs font-semibold text-ob-indigo-600 dark:text-ob-indigo-400 hover:underline cursor-pointer"
            >
              Export CSV
            </button>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[10px]">Institution #0000013</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header & Interactive Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs transition-colors">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ob-indigo-50 dark:bg-ob-indigo-950 text-ob-indigo-700 dark:text-ob-indigo-300 flex items-center justify-center border border-ob-indigo-200 dark:border-ob-indigo-800 shrink-0">
              <BarChart3 className="w-5 h-5 text-ob-indigo-600 dark:text-ob-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Reporting Performance Analytics
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">· 30-Day NBE Statutory Oversight</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutional 4-eyes approval turnaround, submission volume trends, and SLA compliance metrics.
              </p>
            </div>
          </div>

          {/* Interactive Controls & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeRange(7)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  timeRange === 7
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange(14)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  timeRange === 14
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                14D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange(30)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  timeRange === 30
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                30D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange(90)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  timeRange === 90
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                90D
              </button>
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Frequency Filter */}
            <select
              value={selectedFreq}
              onChange={(e) => setSelectedFreq(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Frequencies</option>
              <option value="DAILY">Daily Returns</option>
              <option value="WEEKLY">Weekly Returns</option>
              <option value="MONTHLY">Monthly Returns</option>
              <option value="QUARTERLY">Quarterly Returns</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Refresh Analytics Dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-ob-indigo-600' : ''}`} />
            </button>

            {/* Export Menu */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Export reporting metrics to CSV"
              >
                <Download className="w-3.5 h-3.5 text-ob-indigo-600" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Export reporting dataset to JSON"
              >
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Total Returns Processed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">Total Volume</span>
            <FileSpreadsheet className="w-4 h-4 text-ob-indigo-600 dark:text-ob-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {kpis.totalSubmissions30d}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <span>Past {timeRange} Days</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{kpis.totalDepartmentsReporting} Depts</span>
            </div>
          </div>
        </div>

        {/* Average Review Turnaround Time */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">Avg Turnaround</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white flex items-baseline gap-1">
              <span>{kpis.avgTurnaroundHours}</span>
              <span className="text-xs font-normal text-slate-500">hrs</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <span>Target: 24h</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Median: {kpis.medianTurnaroundHours}h</span>
            </div>
          </div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">SLA Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {kpis.slaComplianceRate}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Reviewed in &le;24 Hours</span>
            </div>
          </div>
        </div>

        {/* First-Pass Verification Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">First-Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-ob-green-600 dark:text-ob-green-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {kpis.firstPassRate}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Zero-Correction Ratio</span>
            </div>
          </div>
        </div>

        {/* In-Flight Pipeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">In-Flight Queue</span>
            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
              {kpis.activeInFlight}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <span>{kpis.pendingCheckerCount} Pending</span>
              <span aria-hidden="true">·</span>
              <span className="text-rose-600 dark:text-rose-400">{kpis.needsCorrectionCount} Needs Edit</span>
            </div>
          </div>
        </div>

        {/* Direct NBE Transmission Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold">NBE Delivered</span>
            <Send className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono text-purple-700 dark:text-purple-400">
              {kpis.transmittedCount}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{kpis.nbeTransmissionRate}% of Approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Data Visualization Section with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Primary Timeline Trend (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs transition-colors flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Regulatory Submission & Transmission Volume Trend</span>
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  ({timeRange} Days)
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Daily progression of returns created, submitted to checker, approved, and delivered to NBE.
              </p>
            </div>

            {/* Chart Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveChartTab('VOLUME')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs font-semibold ${
                  activeChartTab === 'VOLUME'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Volume Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('TURNAROUND')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs font-semibold ${
                  activeChartTab === 'TURNAROUND'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Approval Time Trend
              </button>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="h-64 sm:h-72 w-full min-h-[256px]">
            {activeChartTab === 'VOLUME' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.dailyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorTransmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    interval={timeRange > 30 ? 6 : timeRange > 14 ? 3 : 1}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={32}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Drafts Created"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="submitted"
                    name="Submitted to Checker"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSubmitted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="approved"
                    name="Approved by Checker"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorApproved)"
                  />
                  <Area
                    type="monotone"
                    dataKey="transmitted"
                    name="Delivered to NBE"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTransmitted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.dailyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    interval={timeRange > 30 ? 6 : timeRange > 14 ? 3 : 1}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    unit="h"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={24}
                    stroke="#e11d48"
                    strokeDasharray="4 4"
                    label={{
                      value: '24h Statutory SLA Target',
                      position: 'top',
                      fill: '#e11d48',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar
                    dataKey="avgTurnaroundHours"
                    name="Avg Approval Time (Hours)"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Subtext Footnote */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>Dual-control 4-eyes principle enforced under NBE Banking Supervision Directive BSD/03/2020.</span>
            <span className="font-mono text-[10px]">Active Window: Last {timeRange} Days</span>
          </div>
        </div>

        {/* Right Column: Status Distribution & Review Speed Buckets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-ob-indigo-600 dark:text-ob-indigo-400" />
                <span>Regulatory Pipeline Breakdown</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {kpis.totalSubmissions30d} Total Returns
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Returns`, name]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Total Callout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {kpis.totalSubmissions30d}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Returns</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1.5 mt-2">
              {data.statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                    <span className="text-slate-400 text-[10px]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Turnaround Time Buckets Card */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Review Turnaround Distribution</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">&le;24h Target</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {data.approvalBuckets.map((b) => (
                <div
                  key={b.rangeLabel}
                  className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800"
                >
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate" title={b.rangeLabel}>
                    {b.rangeLabel.replace(' (Over SLA)', '')}
                  </div>
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {b.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Secondary Row: Department Reporting Performance & Timeliness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Compliance & SLA Matrix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-ob-indigo-600 dark:text-ob-indigo-400" />
                <span>Department Performance & Turnaround Speed</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Turnaround efficiency and statutory review compliance by bank department.
              </p>
            </div>
          </div>

          {/* Department Horizontal Bar Comparison */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.departmentPerformance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <YAxis
                  dataKey="shortCode"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [val, name]}
                  content={<CustomTooltip />}
                />
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar
                  dataKey="totalSubmissions"
                  name="Total Returns"
                  fill="#5962AB"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="transmittedCount"
                  name="Delivered to NBE"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Department Performance Table */}
          <div className="overflow-x-auto mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-1.5 pr-2 font-semibold">Department</th>
                  <th className="py-1.5 px-2 font-semibold text-center">Volume</th>
                  <th className="py-1.5 px-2 font-semibold text-center">Avg Turnaround</th>
                  <th className="py-1.5 px-2 font-semibold text-center">SLA Compliance</th>
                  <th className="py-1.5 pl-2 font-semibold text-right">First-Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.departmentPerformance.slice(0, 5).map((d) => (
                  <tr key={d.department} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-1.5 pr-2 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                      {d.department}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-center font-bold text-slate-900 dark:text-white">
                      {d.totalSubmissions}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-center text-slate-700 dark:text-slate-300">
                      {d.avgTurnaroundHours}h
                    </td>
                    <td className="py-1.5 px-2 font-mono text-center">
                      <span className={`font-bold ${d.complianceRate >= 95 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {d.complianceRate}%
                      </span>
                    </td>
                    <td className="py-1.5 pl-2 font-mono text-right text-slate-600 dark:text-slate-400">
                      {d.firstPassRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Frequency Breakdown & Recent 4-Eyes Audits */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Recent 4-Eyes Verified Statutory Returns</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dual-control maker submissions with checker review durations and NBE receipts.
                </p>
              </div>
              {onViewAllSubmissions && (
                <button
                  type="button"
                  onClick={onViewAllSubmissions}
                  className="text-xs text-ob-indigo-600 dark:text-ob-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Ledger</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List of Recent Audited Submissions */}
            <div className="space-y-2">
              {data.recentAuditedSubmissions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs hover:border-ob-indigo-300 dark:hover:border-ob-indigo-700 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-ob-indigo-700 dark:text-ob-indigo-400">
                        {sub.reportKey}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {sub.reportTitle}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Maker: {sub.makerName}</span>
                      <span aria-hidden="true">/</span>
                      <span>Checker: {sub.checkerName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {sub.turnaroundHours}h
                      </span>
                      {sub.withinSla ? (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                          Within SLA
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold">
                          Over SLA
                        </span>
                      )}
                    </div>
                    {sub.nbeReceipt && (
                      <div className="text-[9px] font-mono text-purple-600 dark:text-purple-400 truncate max-w-[120px]" title={sub.nbeReceipt}>
                        {sub.nbeReceipt}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory Governance Note */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full cryptographic audit trail active</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">NBE Institution #0000013</span>
          </div>
        </div>
      </div>
    </div>
  );
};
