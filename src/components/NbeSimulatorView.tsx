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

  const paginatedReceived = receivedSubmissions.slice(
    (receivedPage - 1) * receivedPageSize,
    receivedPage * receivedPageSize
  );

  const paginatedLogs = logs.slice(
    (logsPage - 1) * logsPageSize,
    logsPage * logsPageSize
  );

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-2.5 font-sans">
      {/* 1. Gateway Status & Header Ribbon (Strictly Fixed Height ~54px) */}
      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-md border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-700/80 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-red-600">
            NBE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-xs sm:text-sm font-bold tracking-tight">
                National Bank of Ethiopia (NBE) Gateway Simulator
              </h2>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                Sandbox Mode: {scenario.mode}
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isTesting ? 'Sending...' : 'Test Probe'}</span>
          </button>
          <button
            onClick={fetchData}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
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
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            Simulation Mode:
          </span>
          <select
            value={scenario.mode}
            onChange={(e) => handleUpdateScenario({ mode: e.target.value as any })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="ALWAYS_SUCCESS">Always Success (200 OK + Digital Receipt)</option>
            <option value="VALIDATION_FAILURE">Validation Failure (422 Unprocessable)</option>
            <option value="SERVER_ERROR">Gateway Internal Error (500)</option>
            <option value="TIMEOUT">Gateway Network Timeout</option>
            <option value="RANDOM_FLAKY">Chaos / Flaky Mode</option>
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
              className="w-24 accent-red-600 cursor-pointer"
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

      {/* 3. Sub-tabs Selection (Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'RECEIVED'
                ? 'bg-red-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submissions Received ({receivedSubmissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'LOGS'
                ? 'bg-red-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>HTTP Traffic & Audit Logs ({logs.length})</span>
          </button>
        </div>

        {activeTab === 'LOGS' && logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* 4. Tab 1: Received Submissions Table (Strict flex-1 min-h-0 overflow-hidden) */}
      {activeTab === 'RECEIVED' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {paginatedReceived.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Server className="w-8 h-8 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No Ingested Returns Yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Deliver an approved return from the Checker Inbox or click "Test Probe" above to simulate intake.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10">
                    <th className="py-2 px-3">Official Receipt #</th>
                    <th className="py-2 px-3">Return Key</th>
                    <th className="py-2 px-3">Gateway Status</th>
                    <th className="py-2 px-3">Idempotency Key</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedReceived.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700">
                        {rec.submissionReceiptNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {rec.returnKey}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            rec.status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                        {rec.idempotencyKey}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {new Date(rec.receivedAt).toLocaleTimeString()} · {new Date(rec.receivedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedSubmission(rec)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                        >
                          Inspect Payload
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
              totalItems={receivedSubmissions.length}
              pageSize={receivedPageSize}
              onPageChange={setReceivedPage}
              onPageSizeChange={setReceivedPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        </div>
      )}

      {/* 5. Tab 2: HTTP Traffic & Audit Logs View (Strict flex-1 min-h-0 overflow-hidden) */}
      {activeTab === 'LOGS' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-950 text-slate-300 rounded-xl shadow-2xs border border-slate-800 font-mono text-xs">
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
            {paginatedLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-12">No requests logged yet.</div>
            ) : (
              paginatedLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 border-b border-slate-900 pb-1.5 hover:bg-slate-900/60 p-1 rounded">
                  <span className="text-slate-500 shrink-0 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold text-[10px] shrink-0 ${
                      log.statusCode === 200 || log.statusCode === 201
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    HTTP {log.statusCode}
                  </span>
                  <span className="text-slate-400 shrink-0 font-bold">{log.method} {log.path}</span>
                  <span className="text-slate-200 truncate flex-1">{log.message}</span>
                  <span className="text-slate-500 shrink-0 text-[11px]">{log.durationMs}ms</span>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 p-2 border-t border-slate-800 bg-slate-900">
            <Pagination
              currentPage={logsPage}
              totalItems={logs.length}
              pageSize={logsPageSize}
              onPageChange={setLogsPage}
              onPageSizeChange={setLogsPageSize}
              pageSizeOptions={[8, 15, 30]}
              className="bg-slate-900! text-slate-300! border-slate-800!"
            />
          </div>
        </div>
      )}

      {/* 6. Payload Inspection Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Receipt: {selectedSubmission.submissionReceiptNumber}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Ingested Payload: {selectedSubmission.returnKey}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-3 overflow-y-auto text-xs font-mono flex-1">
              <div>
                <div className="text-slate-600 font-sans font-bold mb-1">HTTP Headers:</div>
                <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedSubmission.headers, null, 2)}
                </pre>
              </div>

              <div>
                <div className="text-slate-600 font-sans font-bold mb-1">Return Data Payload:</div>
                <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedSubmission.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
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
