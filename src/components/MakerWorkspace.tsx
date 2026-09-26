/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ReportMetadata,
  ReportSubmission,
  UserSession,
} from '../types/regulatory.ts';
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
  X,
  Building2,
  Send,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { ExcelService } from '../utils/excelService.ts';
import { Pagination } from './Pagination.tsx';

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

  // Pagination states - 6 per page keeps cards/lists balanced and strictly within fixed window
  const [templatesPage, setTemplatesPage] = useState(1);
  const [templatesPageSize, setTemplatesPageSize] = useState(6);

  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsPageSize, setSubmissionsPageSize] = useState(6);

  const [selectedSubmissionStatus, setSelectedSubmissionStatus] = useState<string>('ALL');

  // Dynamically compute all distinct categories from templates
  const dynamicCategories = ['ALL', ...Array.from(new Set(templates.map((t) => t.Category || 'General')))];

  // Reset pagination when filter changes
  useEffect(() => {
    setTemplatesPage(1);
  }, [searchQuery, selectedCategory, selectedFrequency]);

  useEffect(() => {
    setSubmissionsPage(1);
  }, [searchQuery, selectedSubmissionStatus]);

  // Filtering templates by Name, Regulatory ID/Code, Description, or Category
  const filteredTemplates = templates.filter((tpl) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      tpl.Code.toLowerCase().includes(q) ||
      tpl.Title.toLowerCase().includes(q) ||
      tpl.ReturnKey.toLowerCase().includes(q) ||
      (tpl.Category && tpl.Category.toLowerCase().includes(q)) ||
      (tpl.Description && tpl.Description.toLowerCase().includes(q));

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
    const q = searchQuery.trim().toLowerCase();
    const tpl = templates.find((t) => t.ReturnKey === sub.reportKey);
    const title = tpl ? tpl.Title : sub.reportKey;
    const matchesSearch =
      !q ||
      sub.reportKey.toLowerCase().includes(q) ||
      title.toLowerCase().includes(q) ||
      sub.makerName.toLowerCase().includes(q);

    const matchesStatus =
      selectedSubmissionStatus === 'ALL' || sub.status === selectedSubmissionStatus;

    return matchesSearch && matchesStatus;
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
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ob-indigo-50 dark:bg-ob-indigo-950/60 text-ob-indigo-700 dark:text-ob-indigo-300 border border-ob-indigo-200 dark:border-ob-indigo-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-ob-indigo-500"></span>
            Draft
          </span>
        );
      case 'PENDING_CHECKER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Checker
          </span>
        );
      case 'CORRECTION_REQUIRED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Needs Correction
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Approved
          </span>
        );
      case 'SENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ob-green-50 dark:bg-ob-green-950/60 text-ob-green-800 dark:text-ob-green-300 border border-ob-green-300 dark:border-ob-green-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-ob-green-600 dark:text-ob-green-400" />
            Delivered to NBE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
      {/* 1. Operational KPI Summary Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
        {/* KPI Card 1: Pending Review */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('SUBMISSIONS');
            setSelectedSubmissionStatus('PENDING_CHECKER');
            setSubmissionsPage(1);
          }}
          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between ${
            activeTab === 'SUBMISSIONS' && selectedSubmissionStatus === 'PENDING_CHECKER'
              ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
          }`}
          title="Click to view all submissions awaiting Checker review"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors">
              Pending Review
            </span>
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-lg sm:text-2xl font-extrabold font-mono text-amber-700 dark:text-amber-400">
              {pendingCount}
            </span>
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950 px-1.5 py-0.2 rounded-full border border-amber-200 dark:border-amber-800">
              4-Eyes Queue
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate group-hover:text-slate-600 dark:group-hover:text-slate-400">
            Awaiting Checker approval
          </p>
        </button>

        {/* KPI Card 2: Drafts in Progress */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('SUBMISSIONS');
            setSelectedSubmissionStatus('DRAFT');
            setSubmissionsPage(1);
          }}
          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between ${
            activeTab === 'SUBMISSIONS' && selectedSubmissionStatus === 'DRAFT'
              ? 'bg-ob-indigo-50/90 dark:bg-ob-indigo-950/50 border-ob-indigo-300 dark:border-ob-indigo-700 ring-2 ring-ob-indigo-400/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-ob-indigo-300 dark:hover:border-ob-indigo-700 hover:bg-ob-indigo-50/40 dark:hover:bg-ob-indigo-950/20'
          }`}
          title="Click to view all drafts currently being worked on"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-ob-indigo-950 dark:group-hover:text-ob-indigo-300 transition-colors">
              Drafts in Progress
            </span>
            <div className="p-1.5 rounded-lg bg-ob-indigo-100 dark:bg-ob-indigo-950 text-ob-indigo-800 dark:text-ob-indigo-300 border border-ob-indigo-200 dark:border-ob-indigo-800 shrink-0">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-lg sm:text-2xl font-extrabold font-mono text-ob-indigo-700 dark:text-ob-indigo-400">
              {draftCount}
            </span>
            <span className="text-[10px] font-bold text-ob-indigo-800 dark:text-ob-indigo-300 bg-ob-indigo-100/80 dark:bg-ob-indigo-950 px-1.5 py-0.2 rounded-full border border-ob-indigo-200 dark:border-ob-indigo-800">
              Active Maker
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate group-hover:text-slate-600 dark:group-hover:text-slate-400">
            Reports under preparation
          </p>
        </button>

        {/* KPI Card 3: Recently Sent */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('SUBMISSIONS');
            setSelectedSubmissionStatus('SENT');
            setSubmissionsPage(1);
          }}
          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between ${
            activeTab === 'SUBMISSIONS' && selectedSubmissionStatus === 'SENT'
              ? 'bg-ob-green-50/90 dark:bg-ob-green-950/50 border-ob-green-300 dark:border-ob-green-700 ring-2 ring-ob-green-400/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-ob-green-300 dark:hover:border-ob-green-700 hover:bg-ob-green-50/40 dark:hover:bg-ob-green-950/20'
          }`}
          title="Click to view all returns delivered to NBE Gateway"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-ob-green-950 dark:group-hover:text-ob-green-300 transition-colors">
              Recently Sent
            </span>
            <div className="p-1.5 rounded-lg bg-ob-green-100 dark:bg-ob-green-950 text-ob-green-800 dark:text-ob-green-300 border border-ob-green-300 dark:border-ob-green-800 shrink-0">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-lg sm:text-2xl font-extrabold font-mono text-ob-green-700 dark:text-ob-green-400">
              {sentCount}
            </span>
            <span className="text-[10px] font-bold text-ob-green-800 dark:text-ob-green-300 bg-ob-green-100/80 dark:bg-ob-green-950 px-1.5 py-0.2 rounded-full border border-ob-green-200 dark:border-ob-green-800">
              Delivered
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate group-hover:text-slate-600 dark:group-hover:text-slate-400">
            Verified NBE API receipts
          </p>
        </button>

        {/* KPI Card 4: NBE Return Catalog */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('TEMPLATES');
            setSelectedCategory('ALL');
            setSelectedFrequency('ALL');
            setTemplatesPage(1);
          }}
          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between ${
            activeTab === 'TEMPLATES'
              ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700 ring-2 ring-slate-400/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          title="Click to view all 24 NBE return templates"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[11px] font-bold transition-colors ${
              activeTab === 'TEMPLATES' ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
            }`}>
              NBE Return Catalog
            </span>
            <div className={`p-1.5 rounded-lg shrink-0 ${
              activeTab === 'TEMPLATES'
                ? 'bg-slate-800 text-ob-green-400 border border-slate-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}>
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className={`text-lg sm:text-2xl font-extrabold font-mono ${
              activeTab === 'TEMPLATES' ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}>
              {templates.length}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
              activeTab === 'TEMPLATES'
                ? 'bg-slate-800 text-ob-green-300 border-slate-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}>
              BSD/03/2020
            </span>
          </div>
          <p className={`text-[10px] mt-0.5 truncate ${
            activeTab === 'TEMPLATES' ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'
          }`}>
            Official reporting templates
          </p>
        </button>
      </div>

      {/* 2. Top Search Bar & Filter Ribbon (Strictly Fixed Height) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xs space-y-2.5 shrink-0 transition-colors">
        {/* Top Search Bar with Oromia Bank Brand Styling */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ob-indigo-500 dark:text-ob-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search return templates by name or regulatory ID (e.g. SBR-01, Balance Sheet, Loans, BSD/03/2020)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ob-indigo-500/30 focus:border-ob-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Catalog & Filtered Counters */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active View:</span>
              <span className="font-mono font-bold text-ob-indigo-700 dark:text-ob-indigo-300 bg-ob-indigo-50 dark:bg-ob-indigo-950/60 px-1.5 py-0.2 rounded border border-ob-indigo-200 dark:border-ob-indigo-800">
                {activeTab === 'TEMPLATES' ? `${filteredTemplates.length} returns` : `${filteredSubmissions.length} submissions`}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs, Filter, and View Mode Toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Sub-tab selection */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('TEMPLATES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'TEMPLATES'
                  ? 'bg-ob-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>NBE Return Catalog</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'TEMPLATES'
                    ? 'bg-ob-indigo-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {filteredTemplates.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SUBMISSIONS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'SUBMISSIONS'
                  ? 'bg-ob-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>My Active Submissions</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'SUBMISSIONS'
                    ? 'bg-ob-indigo-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {filteredSubmissions.length}
              </span>
            </button>
          </div>

          {/* Filter & View Mode Controls */}
          <div className="flex items-center gap-2">
            {activeTab === 'TEMPLATES' ? (
              <>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer"
                >
                  {dynamicCategories.map((c) => (
                    <option key={c} value={c} className="dark:bg-slate-900 dark:text-slate-200">
                      {c === 'ALL' ? 'All Categories' : c}
                    </option>
                  ))}
                </select>

                <div className="hidden lg:flex items-center gap-1">
                  {(['ALL', 'MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setSelectedFrequency(freq)}
                      className={`px-2 py-0.8 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        selectedFrequency === freq
                          ? 'bg-ob-indigo-50 dark:bg-ob-indigo-950/80 text-ob-indigo-700 dark:text-ob-indigo-300 border border-ob-indigo-200 dark:border-ob-indigo-800'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>

                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('GRID')}
                    className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                      viewMode === 'GRID'
                        ? 'bg-white dark:bg-slate-700 text-ob-indigo-700 dark:text-white shadow-2xs font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Balanced Card Grid View (6 per page)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('LIST')}
                    className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                      viewMode === 'LIST'
                        ? 'bg-white dark:bg-slate-700 text-ob-indigo-700 dark:text-white shadow-2xs font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Dense Structured List View (6 per page)"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Filter className="w-3 h-3 text-ob-indigo-600 dark:text-ob-indigo-400" />
                  Status:
                </span>
                <select
                  value={selectedSubmissionStatus}
                  onChange={(e) => setSelectedSubmissionStatus(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer"
                >
                  <option value="ALL" className="dark:bg-slate-900">All Status ({submissions.length})</option>
                  <option value="DRAFT" className="dark:bg-slate-900">Draft ({submissions.filter((s) => s.status === 'DRAFT').length})</option>
                  <option value="PENDING_CHECKER" className="dark:bg-slate-900">Pending Checker ({submissions.filter((s) => s.status === 'PENDING_CHECKER').length})</option>
                  <option value="CORRECTION_REQUIRED" className="dark:bg-slate-900">Needs Correction ({submissions.filter((s) => s.status === 'CORRECTION_REQUIRED').length})</option>
                  <option value="APPROVED" className="dark:bg-slate-900">Approved ({submissions.filter((s) => s.status === 'APPROVED').length})</option>
                  <option value="SENT" className="dark:bg-slate-900">Delivered to NBE ({submissions.filter((s) => s.status === 'SENT').length})</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content Viewport (Strictly flex-1 min-h-0 overflow-hidden with internal pagination) */}
      {activeTab === 'TEMPLATES' ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs transition-colors">
          {/* Scrollable Container */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {paginatedTemplates.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No NBE Returns Match Filter</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  No returns found for "{searchQuery}". Try clearing search or selecting "All Categories".
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-3 py-1.5 bg-ob-indigo-50 dark:bg-ob-indigo-950 text-ob-indigo-700 dark:text-ob-indigo-300 border border-ob-indigo-200 dark:border-ob-indigo-800 font-bold text-xs rounded-lg hover:bg-ob-indigo-100 dark:hover:bg-ob-indigo-900"
                  >
                    Clear Search
                  </button>
                )}
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
                      className="bg-slate-50/60 dark:bg-slate-850/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-ob-indigo-300 dark:hover:border-ob-indigo-500 rounded-xl p-3 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs group h-[122px]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="font-mono text-[11px] font-bold text-ob-indigo-700 dark:text-ob-indigo-300 bg-ob-indigo-50 dark:bg-ob-indigo-950/80 border border-ob-indigo-200 dark:border-ob-indigo-800 px-1.5 py-0.2 rounded shrink-0">
                            {tpl.Code}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                              tpl.Frequency === 'MONTHLY'
                                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : tpl.Frequency === 'QUARTERLY'
                                ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {tpl.Frequency}
                          </span>
                        </div>

                        <h4
                          className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-ob-indigo-700 dark:group-hover:text-ob-indigo-300 transition-colors"
                          title={tpl.Title}
                        >
                          {tpl.Title}
                        </h4>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[140px] font-medium text-slate-600 dark:text-slate-300">{tpl.Category}</span>
                          <span>•</span>
                          <span>{tpl.ReturnItemsList.length} items</span>
                          {tpl.DynamicItemsList.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 dark:text-amber-400 font-semibold">{tpl.DynamicItemsList.length} roster</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card Action Strip */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-slate-700/80 mt-1">
                        <div>
                          {latestSub ? (
                            getStatusBadge(latestSub.status)
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">No Draft Yet</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleExportBlank(tpl)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Download Official Blank Excel (XLSX) Template"
                          >
                            <Download className="w-3 h-3" />
                          </button>

                          {latestSub ? (
                            <button
                              type="button"
                              onClick={() => onSelectSubmission(latestSub)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Open Form</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onCreateDraft(tpl.ReturnKey)}
                              className="px-2.5 py-1 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
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
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 z-10">
                    <th className="py-2 px-3">Return Code</th>
                    <th className="py-2 px-3">Report Title</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Frequency</th>
                    <th className="py-2 px-3">Fields & Rosters</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedTemplates.map((tpl) => {
                    const existingSubmissions = submissions.filter((s) => s.reportKey === tpl.ReturnKey);
                    const latestSub = existingSubmissions[0];

                    return (
                      <tr key={tpl.ReturnKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-ob-indigo-700 dark:text-ob-indigo-300">
                          {tpl.Code}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate" title={tpl.Title}>
                          {tpl.Title}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{tpl.Category}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                              tpl.Frequency === 'MONTHLY'
                                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : tpl.Frequency === 'QUARTERLY'
                                ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {tpl.Frequency}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                          {tpl.ReturnItemsList.length} fields
                          {tpl.DynamicItemsList.length > 0 && ` + ${tpl.DynamicItemsList.length} roster`}
                        </td>
                        <td className="py-2 px-3">
                          {latestSub ? getStatusBadge(latestSub.status) : <span className="text-slate-400 dark:text-slate-500">Uninitiated</span>}
                        </td>
                        <td className="py-2 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleExportBlank(tpl)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors inline-flex items-center cursor-pointer"
                            title="Export Excel (XLSX) Template"
                          >
                            <Download className="w-3 h-3" />
                          </button>

                          {latestSub ? (
                            <button
                              type="button"
                              onClick={() => onSelectSubmission(latestSub)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Open Form</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onCreateDraft(tpl.ReturnKey)}
                              className="px-2.5 py-1 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
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
          <div className="shrink-0 p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs transition-colors">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {paginatedSubmissions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Submissions Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Initiate a return draft from the Return Catalog tab above.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 z-10">
                    <th className="py-2 px-3">Return Code</th>
                    <th className="py-2 px-3">Report Name</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3">Maker Name</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedSubmissions.map((sub) => {
                    const tpl = templates.find((t) => t.ReturnKey === sub.reportKey);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-ob-indigo-700 dark:text-ob-indigo-300">
                          {sub.reportKey}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                          {tpl?.Title || sub.reportKey}
                        </td>
                        <td className="py-2.5 px-3">{getStatusBadge(sub.status)}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                          {sub.periodYear} (v{sub.version})
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                          {sub.makerName}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onSelectSubmission(sub)}
                            className="px-2.5 py-1 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{sub.status === 'DRAFT' ? 'Edit Draft' : 'View Return'}</span>
                          </button>

                          {sub.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => onSubmitToChecker(sub.id)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
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
          <div className="shrink-0 p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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
