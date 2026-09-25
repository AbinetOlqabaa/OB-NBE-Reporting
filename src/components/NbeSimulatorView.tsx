/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCw,
  Terminal,
  Trash2,
  Eye,
  Sliders,
  ShieldCheck,
  Server,
  Layers,
  Activity,
  X,
  Filter,
} from 'lucide-react';
import { SimulationScenarioConfig } from '../types/regulatory';
import { Pagination } from './Pagination';

interface ReceivedReport {
  id: string;
  receivedAt: string;
  returnKey: string;
  institutionCode: string;
  finYear: number;
  periodStart: string;
  periodEnd: string;
  payload: any;
  headers: Record<string, string>;
  idempotencyKey: string;
  correlationId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'DUPLICATE';
  validationErrors?: string[];
  submissionReceiptNumber: string;
}

interface SimulatorLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  idempotencyKey?: string;
  correlationId?: string;
  message: string;
  durationMs: number;
}

export const NbeSimulatorView: React.FC = () => {
  const [scenario, setScenario] = useState<SimulationScenarioConfig>({
    mode: 'ALWAYS_SUCCESS',
    failureRatePercent: 0,
    latencyMs: 150,
  });
  const [receivedSubmissions, setReceivedSubmissions] = useState<ReceivedReport[]>([]);
  const [logs, setLogs] = useState<SimulatorLog[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ReceivedReport | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'LOGS'>('RECEIVED');

  // Filter states
  const [receivedStatusFilter, setReceivedStatusFilter] = useState<string>('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('ALL');

  // Pagination for received submissions
  const [receivedPage, setReceivedPage] = useState(1);
  const [receivedPageSize, setReceivedPageSize] = useState(5);

  // Pagination for simulator logs
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(8);

  const fetchData = async () => {
    try {
      const [subRes, logsRes, scenRes] = await Promise.all([
        fetch('/api/nbe-simulator/submissions').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/nbe-simulator/logs').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/nbe-simulator/scenario').then((r) => (r.ok ? r.json() : null)),
      ]);
      setReceivedSubmissions(Array.isArray(subRes) ? subRes : []);
      setLogs(Array.isArray(logsRes) ? logsRes : []);
      if (scenRes && scenRes.mode) setScenario(scenRes);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateScenario = async (partial: Partial<SimulationScenarioConfig>) => {
    const next = { ...scenario, ...partial };
    setScenario(next);
    try {
      await fetch('/api/nbe-simulator/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    } catch {}
  };

  const handleSendTestPayload = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/nbe-simulator/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `TEST_IDEMP_${Date.now()}`,
          'X-Correlation-ID': `TEST_CORR_${Date.now()}`,
        },
        body: JSON.stringify({
          returnKey: 'POBEPE001',
          institutionCode: '0000013',
          finYear: 2026,
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
          values: { R01_C01: 5000000, R02_C01: 5000000 },
          dynamicRows: {},
        }),
      });
      const data = await res.json();
      setTestResult({ statusCode: res.status, body: data });
      await fetchData();
    } catch (err: any) {
      setTestResult({ statusCode: 0, body: { error: err.message } });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/nbe-simulator/logs', { method: 'DELETE' });
      setLogs([]);
      setLogsPage(1);
    } catch {}
  };

  // Filter received submissions
  const filteredReceived = receivedSubmissions.filter((sub) => {
    if (receivedStatusFilter === 'ALL') return true;
    return sub.status === receivedStatusFilter;
  });

  const paginatedReceived = filteredReceived.slice(
    (receivedPage - 1) * receivedPageSize,
    receivedPage * receivedPageSize
  );

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (logStatusFilter === 'ALL') return true;
    if (logStatusFilter === '200_SUCCESS') return log.statusCode === 200 || log.statusCode === 201;
    if (logStatusFilter === '401_AUTH') return log.statusCode === 401 || log.statusCode === 403;
    if (logStatusFilter === '422_VALIDATION') return log.statusCode === 422;
    if (logStatusFilter === '500_SERVER_ERROR') return log.statusCode === 500;
    if (logStatusFilter === '504_TIMEOUT') return log.statusCode === 504;
    return true;
  });

  const paginatedLogs = filteredLogs.slice(
    (logsPage - 1) * logsPageSize,
    logsPage * logsPageSize
  );

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-2.5 font-sans">
      {/* 1. Header Banner (Compact, Fixed Height) */}
      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-md border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ob-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-ob-indigo-500">
            NBE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                National Bank of Ethiopia (NBE) API Gateway Simulator
              </h2>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-ob-green-400 px-1.5 py-0.2 rounded border border-slate-700">
                Mode: {scenario.mode}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Validates schema, idempotency keys, signature tokens, and issues digital intake receipts.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSendTestPayload}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3 h-3 text-ob-green-300" />
            <span>{isTesting ? 'Sending...' : 'Test Probe'}</span>
          </button>
          <button
            onClick={fetchData}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Compact Gateway Scenario Controls Bar (Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-ob-indigo-600" />
            Simulation Mode:
          </span>
          <select
            value={scenario.mode}
            onChange={(e) => handleUpdateScenario({ mode: e.target.value as any })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer"
          >
            <option value="ALWAYS_SUCCESS">Always Success (200 OK + Digital Receipt)</option>
            <option value="VALIDATION_FAILURE">Validation Failure (422 Unprocessable)</option>
            <option value="AUTH_FAILURE">Auth / Token Failure (401/403 Invalid Signature)</option>
            <option value="SERVER_ERROR">Gateway Internal Error (500)</option>
            <option value="TIMEOUT">Gateway Network Timeout (504)</option>
            <option value="RANDOM_FLAKY">Chaos / Flaky Mode (Random Errors)</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Latency:</span>
            <input
              type="range"
              min="0"
              max="1500"
              step="50"
              value={scenario.latencyMs}
              onChange={(e) => handleUpdateScenario({ latencyMs: parseInt(e.target.value, 10) })}
              className="w-24 accent-ob-indigo-600 cursor-pointer"
            />
            <span className="font-mono font-bold text-[11px] text-slate-700">{scenario.latencyMs}ms</span>
          </div>

          {testResult && (
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400">Last Probe:</span>
              <span
                className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  testResult.statusCode === 200 || testResult.statusCode === 201
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                HTTP {testResult.statusCode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Sub-tabs Selection & Filter Bar (Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'RECEIVED'
                ? 'bg-ob-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submissions Received ({receivedSubmissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'LOGS'
                ? 'bg-ob-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>HTTP Traffic & Audit Logs ({logs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'RECEIVED' ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Filter className="w-3 h-3 text-ob-indigo-600" />
                Status:
              </span>
              <select
                value={receivedStatusFilter}
                onChange={(e) => {
                  setReceivedStatusFilter(e.target.value);
                  setReceivedPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Status ({receivedSubmissions.length})</option>
                <option value="ACCEPTED">ACCEPTED ({receivedSubmissions.filter((s) => s.status === 'ACCEPTED').length})</option>
                <option value="REJECTED">REJECTED ({receivedSubmissions.filter((s) => s.status === 'REJECTED').length})</option>
                <option value="DUPLICATE">DUPLICATE ({receivedSubmissions.filter((s) => s.status === 'DUPLICATE').length})</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Filter className="w-3 h-3 text-ob-indigo-600" />
                  Filter HTTP:
                </span>
                <select
                  value={logStatusFilter}
                  onChange={(e) => {
                    setLogStatusFilter(e.target.value);
                    setLogsPage(1);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All HTTP Logs ({logs.length})</option>
                  <option value="200_SUCCESS">200 / 201 Success</option>
                  <option value="401_AUTH">401 / 403 Auth Error</option>
                  <option value="422_VALIDATION">422 Validation Error</option>
                  <option value="500_SERVER_ERROR">500 Server Error</option>
                  <option value="504_TIMEOUT">504 Gateway Timeout</option>
                </select>
              </div>

              {logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50 cursor-pointer"
                  title="Clear log history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Tab 1: Received Submissions Table (Strict flex-1 min-h-0 overflow-hidden) */}
      {activeTab === 'RECEIVED' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {paginatedReceived.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Server className="w-8 h-8 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No Ingested Returns Match</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Deliver an approved return from the Checker Inbox or click "Test Probe" above to simulate intake.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10">
                    <th className="py-2 px-3">Receipt Time</th>
                    <th className="py-2 px-3">Return Code</th>
                    <th className="py-2 px-3">Institution</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Receipt Token</th>
                    <th className="py-2 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedReceived.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                        {new Date(sub.receivedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-ob-indigo-700">
                        {sub.returnKey}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {sub.institutionCode} (Oromia Bank)
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sub.status === 'DUPLICATE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                        {sub.submissionReceiptNumber}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Payload</span>
                        </button>
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
              currentPage={receivedPage}
              totalItems={filteredReceived.length}
              pageSize={receivedPageSize}
              onPageChange={setReceivedPage}
              onPageSizeChange={setReceivedPageSize}
              pageSizeOptions={[5, 10, 20]}
              itemName="submissions"
            />
          </div>
        </div>
      )}

      {/* 5. Tab 2: HTTP Traffic Logs Table */}
      {activeTab === 'LOGS' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {paginatedLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Terminal className="w-8 h-8 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No Gateway Traffic Logs</h3>
                <p className="text-xs text-slate-500 mt-1">API interactions will appear here in real-time.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Method & Path</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Duration</th>
                    <th className="py-2 px-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-800">
                        <span className="font-bold text-ob-indigo-700 mr-1">{log.method}</span>
                        <span>{log.path}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-mono px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            log.statusCode === 200 || log.statusCode === 201
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.statusCode === 422
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          HTTP {log.statusCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                        {log.durationMs}ms
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-sm" title={log.message}>
                        {log.message}
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
              currentPage={logsPage}
              totalItems={filteredLogs.length}
              pageSize={logsPageSize}
              onPageChange={setLogsPage}
              onPageSizeChange={setLogsPageSize}
              pageSizeOptions={[8, 15, 30]}
              itemName="logs"
            />
          </div>
        </div>
      )}

      {/* Payload Modal Viewer */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-ob-indigo-700 bg-ob-indigo-50 px-2 py-0.5 rounded border border-ob-indigo-200">
                  {selectedSubmission.returnKey}
                </span>
                <span className="font-bold text-xs text-slate-900">
                  Intake Payload Receipt: {selectedSubmission.submissionReceiptNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Receipt Envelope Headers:</span>
                <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedSubmission.headers, null, 2)}
                </pre>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Digital Return Payload (NBE Format):</span>
                <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedSubmission.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
