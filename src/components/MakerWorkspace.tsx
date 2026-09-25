/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ReportMetadata,
  ReportSubmission,
  UserSession,
} from '../types/regulatory';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Eye,
  Edit3,
  Layers,
  Download,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
} from 'lucide-react';
import { ExcelService } from '../utils/excelService';
import { Pagination } from './Pagination';

interface MakerWorkspaceProps {
  templates: ReportMetadata[];
  submissions: ReportSubmission[];
  currentUser: UserSession;
  onSelectSubmission: (submission: ReportSubmission) => void;
  onCreateDraft: (reportKey: string) => void;
  onSubmitToChecker: (submissionId: string, comment?: string) => void;
}

export const MakerWorkspace: React.FC<MakerWorkspaceProps> = ({
  templates,
  submissions,
  currentUser,
  onSelectSubmission,
  onCreateDraft,
  onSubmitToChecker,
}) => {
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'SUBMISSIONS'>('TEMPLATES');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('ALL');
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] = useState<ReportMetadata | null>(null);

  // Pagination states - 6 per page keeps cards/lists balanced and strictly within fixed window
  const [templatesPage, setTemplatesPage] = useState(1);
  const [templatesPageSize, setTemplatesPageSize] = useState(6);

  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsPageSize, setSubmissionsPageSize] = useState(6);

  // Categories
  const categories = [
    'ALL',
    'Credit & Lending',
    'Classification & Provisioning',
    'Exposures & Concentration',
    'Assets & Collateral',
    'Restructuring',
    'Sector Breakdown',
  ];

  // Reset pagination when filter changes
  useEffect(() => {
    setTemplatesPage(1);
  }, [searchQuery, selectedCategory, selectedFrequency]);

  useEffect(() => {
    setSubmissionsPage(1);
  }, [searchQuery]);

  // Filtering templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.Code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.Description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || tpl.Category === selectedCategory;
    const matchesFreq =
      selectedFrequency === 'ALL' || tpl.Frequency === selectedFrequency;
    return matchesSearch && matchesCategory && matchesFreq;
  });

  // Paginated templates slice
  const paginatedTemplates = filteredTemplates.slice(
    (templatesPage - 1) * templatesPageSize,
    templatesPage * templatesPageSize
  );

  // Filtering submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const tpl = templates.find((t) => t.ReturnKey === sub.reportKey);
    const title = tpl ? tpl.Title : sub.reportKey;
    const matchesSearch =
      sub.reportKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.makerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Paginated submissions slice
  const paginatedSubmissions = filteredSubmissions.slice(
    (submissionsPage - 1) * submissionsPageSize,
    submissionsPage * submissionsPageSize
  );

  // Export blank template to XLSX
  const handleExportBlank = (tpl: ReportMetadata) => {
    const binary = ExcelService.exportToBinary(tpl, {}, {});
    const blob = new Blob([binary as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEMPLATE_${tpl.Code}_${tpl.FinYear}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Draft
          </span>
        );
      case 'PENDING_CHECKER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Checker
          </span>
        );
      case 'CORRECTION_REQUIRED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Needs Correction
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'SENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-purple-600" />
            Delivered to NBE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const draftCount = submissions.filter((s) => s.status === 'DRAFT').length;
  const pendingCount = submissions.filter((s) => s.status === 'PENDING_CHECKER').length;
  const sentCount = submissions.filter((s) => s.status === 'SENT').length;

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-2.5 font-sans">
      {/* 1. Compact Top Metrics Ribbon (Strictly Fixed Height ~56px) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">NBE Returns</span>
            <div className="text-lg font-bold text-slate-900 leading-tight">{templates.length}</div>
            <span className="text-[10px] text-slate-500">100% Schema Mapped</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Active Drafts</span>
            <div className="text-lg font-bold text-blue-700 leading-tight">{draftCount}</div>
            <span className="text-[10px] text-slate-500">In preparation</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending Checker</span>
            <div className="text-lg font-bold text-amber-700 leading-tight">{pendingCount}</div>
            <span className="text-[10px] text-slate-500">4-Eyes Review Queue</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Delivered NBE</span>
            <div className="text-lg font-bold text-emerald-700 leading-tight">{sentCount}</div>
            <span className="text-[10px] text-slate-500">Cryptographic Receipt</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar (Compact, Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-2 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Sub-tab selection */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('TEMPLATES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'TEMPLATES'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>NBE Return Catalog</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'TEMPLATES'
                    ? 'bg-red-800 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {filteredTemplates.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SUBMISSIONS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'SUBMISSIONS'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>My Active Submissions</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'SUBMISSIONS'
                    ? 'bg-red-800 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {filteredSubmissions.length}
              </span>
            </button>
          </div>

          {/* Search & Layout toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search return code, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white"
              />
            </div>

            {activeTab === 'TEMPLATES' && (
              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setViewMode('GRID')}
                  className={`p-1 rounded text-xs transition-colors ${
                    viewMode === 'GRID'
                      ? 'bg-white text-red-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Balanced Card Grid View (6 per page)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('LIST')}
                  className={`p-1 rounded text-xs transition-colors ${
                    viewMode === 'LIST'
                      ? 'bg-white text-red-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Dense Structured List View (6 per page)"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Row (Only when in TEMPLATES view) */}
        {activeTab === 'TEMPLATES' && (
          <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-100 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
              <Filter className="w-3 h-3" />
              Category:
            </span>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories (24 Returns)' : c}
                </option>
              ))}
            </select>

            <span className="text-slate-300">|</span>

            <span className="text-slate-400 font-medium text-[11px]">Frequency:</span>
            <div className="flex items-center gap-1">
              {(['ALL', 'MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setSelectedFrequency(freq)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    selectedFrequency === freq
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Content Viewport (Strictly flex-1 min-h-0 overflow-hidden with internal pagination) */}
      {activeTab === 'TEMPLATES' ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
          {/* Scrollable Container */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {paginatedTemplates.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No NBE Returns Found</h3>
                <p className="text-xs text-slate-500 mt-1">Try relaxing your search terms or category filter.</p>
              </div>
            ) : viewMode === 'GRID' ? (
              /* Balanced Compact Card Grid - 3 columns x 2 rows, perfectly fitting inside window */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {paginatedTemplates.map((tpl) => {
                  const existingSubmissions = submissions.filter((s) => s.reportKey === tpl.ReturnKey);
                  const latestSub = existingSubmissions[0];

                  return (
                    <div
                      key={tpl.ReturnKey}
                      className="bg-slate-50/60 hover:bg-white border border-slate-200 hover:border-red-300 rounded-xl p-3 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs group h-[122px]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="font-mono text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded shrink-0">
                            {tpl.Code}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                              tpl.Frequency === 'MONTHLY'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : tpl.Frequency === 'QUARTERLY'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {tpl.Frequency}
                          </span>
                        </div>

                        <h4
                          className="text-xs font-bold text-slate-900 truncate group-hover:text-red-700 transition-colors"
                          title={tpl.Title}
                        >
                          {tpl.Title}
                        </h4>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                          <span className="truncate max-w-[140px] font-medium text-slate-600">{tpl.Category}</span>
                          <span>•</span>
                          <span>{tpl.ReturnItemsList.length} items</span>
                          {tpl.DynamicItemsList.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 font-semibold">{tpl.DynamicItemsList.length} roster</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card Action Strip */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 mt-1">
                        <div>
                          {latestSub ? (
                            getStatusBadge(latestSub.status)
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">No Draft Yet</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleExportBlank(tpl)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Download Official Blank Excel (XLSX) Template"
                          >
                            <Download className="w-3 h-3" />
                          </button>

                          {latestSub ? (
                            <button
                              type="button"
                              onClick={() => onSelectSubmission(latestSub)}
                              className="px-2 py-0.8 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Open Form</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onCreateDraft(tpl.ReturnKey)}
                              className="px-2 py-0.8 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Initiate</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Structured List View - Clean table fitting 6 items per page */
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10">
                    <th className="py-2 px-3">Return Code</th>
                    <th className="py-2 px-3">Report Title</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Frequency</th>
                    <th className="py-2 px-3">Fields & Rosters</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTemplates.map((tpl) => {
                    const existingSubmissions = submissions.filter((s) => s.reportKey === tpl.ReturnKey);
                    const latestSub = existingSubmissions[0];

                    return (
                      <tr key={tpl.ReturnKey} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-red-700">
                          {tpl.Code}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 max-w-xs truncate" title={tpl.Title}>
                          {tpl.Title}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{tpl.Category}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                              tpl.Frequency === 'MONTHLY'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : tpl.Frequency === 'QUARTERLY'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {tpl.Frequency}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {tpl.ReturnItemsList.length} fields
                          {tpl.DynamicItemsList.length > 0 && ` + ${tpl.DynamicItemsList.length} roster`}
                        </td>
                        <td className="py-2 px-3">
                          {latestSub ? getStatusBadge(latestSub.status) : <span className="text-slate-400">Uninitiated</span>}
                        </td>
                        <td className="py-2 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleExportBlank(tpl)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors inline-flex items-center"
                            title="Export Excel (XLSX) Template"
                          >
                            <Download className="w-3 h-3" />
                          </button>

                          {latestSub ? (
                            <button
                              type="button"
                              onClick={() => onSelectSubmission(latestSub)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Open Form</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onCreateDraft(tpl.ReturnKey)}
                              className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Initiate Draft</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="shrink-0 p-2 border-t border-slate-200 bg-slate-50/50">
            <Pagination
              currentPage={templatesPage}
              totalItems={filteredTemplates.length}
              pageSize={templatesPageSize}
              onPageChange={setTemplatesPage}
              onPageSizeChange={setTemplatesPageSize}
              pageSizeOptions={[6, 9, 12, 24]}
            />
          </div>
        </div>
      ) : (
        /* Submissions Tab - Compact Table View */
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {paginatedSubmissions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No Submissions Found</h3>
                <p className="text-xs text-slate-500 mt-1">Initiate a return draft from the Return Catalog tab above.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10">
                    <th className="py-2 px-3">Return Code</th>
                    <th className="py-2 px-3">Report Name</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3">Maker Name</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSubmissions.map((sub) => {
                    const tpl = templates.find((t) => t.ReturnKey === sub.reportKey);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-red-700">
                          {sub.reportKey}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 max-w-xs truncate">
                          {tpl?.Title || sub.reportKey}
                        </td>
                        <td className="py-2.5 px-3">{getStatusBadge(sub.status)}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">
                          {sub.periodYear} (v{sub.version})
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {sub.makerName}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onSelectSubmission(sub)}
                            className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{sub.status === 'DRAFT' ? 'Edit Draft' : 'View Return'}</span>
                          </button>

                          {sub.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => onSubmitToChecker(sub.id)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                              title="Submit prepared return for Checker 4-eyes review"
                            >
                              <Clock className="w-3 h-3" />
                              <span>Submit</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Submissions Pagination Footer */}
          <div className="shrink-0 p-2 border-t border-slate-200 bg-slate-50/50">
            <Pagination
              currentPage={submissionsPage}
              totalItems={filteredSubmissions.length}
              pageSize={submissionsPageSize}
              onPageChange={setSubmissionsPage}
              onPageSizeChange={setSubmissionsPageSize}
              pageSizeOptions={[6, 10, 15, 25]}
            />
          </div>
        </div>
      )}
    </div>
  );
};
