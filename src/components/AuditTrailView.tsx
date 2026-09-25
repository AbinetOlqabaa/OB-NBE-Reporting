/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  RotateCw,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { AuditLogEntry } from '../types/regulatory';
import { Pagination } from './Pagination';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Pagination state - 8 items per page keeps window strictly fixed
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs?limit=200');
      const data = await res.json();
      setLogs(data || []);
    } catch (e) {
      console.warn('Failed to load audit logs from API', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, actionFilter]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const exportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Entity ID', 'Details', 'Correlation ID'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      `"${l.actorName}"`,
      l.actorRole,
      l.action,
      l.entityId,
      `"${l.details.replace(/"/g, '""')}"`,
      l.correlationId,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `OB_AUDIT_TRAIL_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `OB_AUDIT_TRAIL_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVE')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (action.includes('REJECT')) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (action.includes('SUBMIT')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (action.includes('DELIVER') || action.includes('SEND')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('CREATE')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-2.5 font-sans">
      {/* 1. Header Banner (Compact, Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-red-100 rounded-lg text-red-700">
              <History className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Immutable Regulatory Compliance Audit Trail
            </h2>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30">
              BSD/03/2020
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cryptographically timestamped audit logging for Maker drafts, Checker 4-eyes reviews, and NBE transmissions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3 h-3" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={fetchLogs}
            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            title="Refresh logs"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Strip (Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Action:
          </span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            <option value="CREATE_DRAFT">CREATE_DRAFT</option>
            <option value="UPDATE_VALUES">UPDATE_VALUES</option>
            <option value="SUBMIT_TO_CHECKER">SUBMIT_TO_CHECKER</option>
            <option value="REVIEW_APPROVE">REVIEW_APPROVE</option>
            <option value="REVIEW_REJECT">REVIEW_REJECT</option>
            <option value="REVIEW_CORRECTION">REVIEW_CORRECTION</option>
            <option value="DELIVER_TO_NBE">DELIVER_TO_NBE</option>
            <option value="INGEST_DATA">INGEST_DATA</option>
          </select>
        </div>
      </div>

      {/* 3. Audit Logs Table (Strict flex-1 min-h-0 overflow-hidden) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex-1 min-h-0 overflow-y-auto">
          {paginatedLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <History className="w-8 h-8 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Audit Events Found</h3>
              <p className="text-xs text-slate-500 mt-1">Actions performed on reports and users will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Actor & Role</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Entity ID</th>
                  <th className="py-2 px-3">Audit Details</th>
                  <th className="py-2 px-3 font-mono">Correlation ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                      <span className="text-slate-400">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">{log.actorRole}</div>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-2 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap text-[11px]">
                      {log.entityId}
                    </td>

                    <td className="py-2 px-3 text-slate-600 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>

                    <td className="py-2 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {log.correlationId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="shrink-0 p-2 border-t border-slate-200 bg-slate-50/50">
          <Pagination
            currentPage={page}
            totalItems={filteredLogs.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[8, 15, 30]}
            itemName="audit logs"
          />
        </div>
      </div>
    </div>
  );
};
