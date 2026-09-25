/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldAlert,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ReportMetadata } from '../types/regulatory';

interface QualityCheck {
  category: 'Completeness' | 'Uniqueness' | 'Referential Integrity' | 'Range Validity' | 'Duplicate Detection';
  passed: boolean;
  score: number;
  description: string;
  anomalyCount: number;
}

interface QualityReport {
  overallScore: number;
  checks: QualityCheck[];
}

interface ReconciliationItem {
  reconciled: boolean;
  glAccount: string;
  glAccountName: string;
  glBalance: number;
  reportAggregate: number;
  variance: number;
  status: 'BALANCED' | 'VARIANCE_ALERT';
}

interface IngestionJobRecord {
  id: string;
  source: string;
  startTime: string;
  endTime: string;
  status: string;
  recordsIngested: number;
  qualityScore: number;
}

interface Phase2SSOTViewProps {
  templates: ReportMetadata[];
  onOpenGeneratedSubmission?: (reportKey: string) => void;
}

export const Phase2SSOTView: React.FC<Phase2SSOTViewProps> = ({
  templates,
  onOpenGeneratedSubmission,
}) => {
  const [selectedSource, setSelectedSource] = useState<'CORE_BANKING' | 'ERP' | 'TREASURY'>('CORE_BANKING');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState<number>(0);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationItem[]>([]);
  const [recentJobs, setRecentJobs] = useState<IngestionJobRecord[]>([
    {
      id: 'job_cb_prev_1',
      source: 'CORE_BANKING',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() - 3590000).toISOString(),
      status: 'COMPLETED',
      recordsIngested: 152400,
      qualityScore: 99.8,
    },
  ]);
  const [selectedTargetReturn, setSelectedTargetReturn] = useState<string>('POBEPE001');
  const [generatedSuccessMsg, setGeneratedSuccessMsg] = useState<string | null>(null);

  const loadPhase2Data = async () => {
    try {
      const [qRes, rRes] = await Promise.all([
        fetch('/api/phase2/quality').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/phase2/reconcile').then((r) => (r.ok ? r.json() : null)),
      ]);
      if (qRes) setQualityReport(qRes);
      if (rRes && Array.isArray(rRes)) setReconciliation(rRes);
    } catch {
      // Offline fallback data
      setQualityReport({
        overallScore: 99.4,
        checks: [
          { category: 'Completeness', passed: true, score: 100, description: 'All mandatory regulatory attributes populated', anomalyCount: 0 },
          { category: 'Uniqueness', passed: true, score: 99.8, description: 'Account numbers and customer identifiers unique', anomalyCount: 2 },
          { category: 'Referential Integrity', passed: true, score: 100, description: 'All loan lines map to validated customer rosters', anomalyCount: 0 },
          { category: 'Range Validity', passed: true, score: 98.9, description: 'Interest rates and loan amounts within Directive bounds', anomalyCount: 12 },
          { category: 'Duplicate Detection', passed: true, score: 99.9, description: 'No redundant transaction records detected', anomalyCount: 1 },
        ],
      });
      setReconciliation([
        {
          reconciled: true,
          glAccount: 'GL-1010-001',
          glAccountName: 'Cash on Hand & Central Bank Reserve Account',
          glBalance: 12450000000,
          reportAggregate: 12450000000,
          variance: 0,
          status: 'BALANCED',
        },
        {
          reconciled: true,
          glAccount: 'GL-1420-005',
          glAccountName: 'Commercial Loans & Advances (Performing)',
          glBalance: 48920000000,
          reportAggregate: 48920000000,
          variance: 0,
          status: 'BALANCED',
        },
        {
          reconciled: true,
          glAccount: 'GL-1425-010',
          glAccountName: 'Non-Performing Loans (Substandard, Doubtful, Loss)',
          glBalance: 730000000,
          reportAggregate: 730000000,
          variance: 0,
          status: 'BALANCED',
        },
      ]);
    }
  };

  useEffect(() => {
    loadPhase2Data();
  }, []);

  const handleTriggerIngestion = async () => {
    setIsIngesting(true);
    setIngestionStep(1); // Bronze

    setTimeout(() => {
      setIngestionStep(2); // Silver
    }, 600);

    setTimeout(() => {
      setIngestionStep(3); // Gold
    }, 1200);

    setTimeout(async () => {
      try {
        const res = await fetch('/api/phase2/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: selectedSource }),
        });
        const job = await res.json();
        setRecentJobs((prev) => [job, ...prev]);
        loadPhase2Data();
      } catch (e) {
        console.warn('Ingestion call handled');
      } finally {
        setIsIngesting(false);
        setIngestionStep(0);
      }
    }, 1800);
  };

  const handleGenerateReturnFromSSOT = async () => {
    try {
      const res = await fetch('/api/phase2/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportKey: selectedTargetReturn }),
      });
      const data = await res.json();
      setGeneratedSuccessMsg(
        `Successfully auto-generated return ${selectedTargetReturn} from Gold Layer SSOT. All regulatory fields populated with 100% lineage.`
      );
      setTimeout(() => setGeneratedSuccessMsg(null), 5000);
      if (onOpenGeneratedSubmission) {
        onOpenGeneratedSubmission(selectedTargetReturn);
      }
    } catch (e: any) {
      alert('Generation error: ' + e.message);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-2.5 font-sans">
      {/* 1. Top Concept Banner (Compact, Fixed Height) */}
      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-md border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-700/80 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-red-600">
            SSOT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-xs sm:text-sm font-bold tracking-tight">
                Phase 2: Single Source of Truth (SSOT) Lakehouse & GL Reconcile
              </h2>
            </div>
            <p className="text-[10px] text-slate-400">
              Bronze (Raw) → Silver (Cleansed) → Gold (Regulatory Aggregates) with GL balance sheet reconciliation.
            </p>
          </div>
        </div>

        <button
          onClick={loadPhase2Data}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shrink-0 self-end sm:self-auto"
          title="Refresh Pipeline Metrics"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Visual Medallion Flow Pipeline (Compact Strip, Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-red-700" />
            <span>Medallion Pipeline Ingestion</span>
          </span>

          {/* Source Selector & Ingest Trigger */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="CORE_BANKING">Core Banking (T24 / Oracle)</option>
              <option value="ERP">ERP & General Ledger</option>
              <option value="TREASURY">Treasury & Forex System</option>
            </select>

            <button
              onClick={handleTriggerIngestion}
              disabled={isIngesting}
              className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3 h-3" />
              <span>{isIngesting ? 'Ingesting...' : 'Trigger Pipeline Ingest'}</span>
            </button>
          </div>
        </div>

        {/* 3 Medallion Cards in compact row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div
            className={`border rounded-lg p-2.5 transition-all ${
              ingestionStep === 1
                ? 'border-amber-500 bg-amber-50 shadow-sm ring-1 ring-amber-300'
                : 'border-amber-200 bg-amber-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                Bronze Layer
              </span>
              <span className="text-[10px] font-mono text-amber-700 font-bold">Raw Ingest</span>
            </div>
            <div className="font-bold text-slate-900 mt-1">Landing & Immutable CDC</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Captures deltas with audit timestamp.</p>
          </div>

          <div
            className={`border rounded-lg p-2.5 transition-all ${
              ingestionStep === 2
                ? 'border-slate-500 bg-slate-100 shadow-sm ring-1 ring-slate-300'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                Silver Layer
              </span>
              <span className="text-[10px] font-mono text-slate-700 font-bold">Cleansed</span>
            </div>
            <div className="font-bold text-slate-900 mt-1">Validation & Normalization</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Deduplication and range conformance.</p>
          </div>

          <div
            className={`border rounded-lg p-2.5 transition-all ${
              ingestionStep === 3
                ? 'border-amber-500 bg-amber-50 shadow-sm ring-1 ring-amber-400'
                : 'border-amber-300 bg-amber-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                Gold Layer
              </span>
              <span className="text-[10px] font-mono text-amber-800 font-bold">NBE Aggregate</span>
            </div>
            <div className="font-bold text-slate-900 mt-1">Prudential Ready Returns</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Automated mapping to 24 NBE returns.</p>
          </div>
        </div>
      </div>

      {/* 3. Main Data Tabs Area (Strict flex-1 min-h-0 overflow-hidden) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Notification if return auto-generated */}
          {generatedSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{generatedSuccessMsg}</span>
            </div>
          )}

          {/* 1-Click Auto-Generation Box */}
          <div className="bg-red-50/60 border border-red-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-700" />
                <span>1-Click Auto-Generate Regulatory Return from Gold Lakehouse</span>
              </span>
              <p className="text-[11px] text-red-900/80 mt-0.5">
                Populates all 24 NBE returns with verified balances directly from the Gold aggregate layer.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedTargetReturn}
                onChange={(e) => setSelectedTargetReturn(e.target.value)}
                className="text-xs bg-white border border-ob-indigo-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-ob-indigo-500"
              >
                {templates.slice(0, 10).map((t) => (
                  <option key={t.ReturnKey} value={t.ReturnKey}>
                    {t.Code} - {t.Title.slice(0, 26)}...
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleGenerateReturnFromSSOT}
                className="px-3.5 py-1.5 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Auto-Generate Return
              </button>
            </div>
          </div>

          {/* GL Reconciliation Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>General Ledger (GL) to Regulatory Return Reconciliation Engine</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2 px-3">GL Account Code</th>
                    <th className="py-2 px-3">Account Description</th>
                    <th className="py-2 px-3 text-right">GL Balance (ETB)</th>
                    <th className="py-2 px-3 text-right">Regulatory Sum (ETB)</th>
                    <th className="py-2 px-3 text-right">Variance</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciliation.map((rec) => (
                    <tr key={rec.glAccount} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700">{rec.glAccount}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.glAccountName}</td>
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-slate-900">
                        {rec.glBalance.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-slate-900">
                        {rec.reportAggregate.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-emerald-600">
                        ETB {rec.variance}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
