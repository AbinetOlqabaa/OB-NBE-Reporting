/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  X,
  Plus,
  RefreshCw,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  Copy,
  Trash2,
  Edit3,
  Eye,
  Send,
  Sparkles,
  Layers,
  Calendar,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
  FileCheck2,
} from 'lucide-react';
import {
  ReportMetadata,
  ReportSubmission,
  UserSession,
  LibraryLifecycleState,
  LibraryFilterOptions,
  LibraryQueryResult,
  deriveLibraryLifecycleState,
  isFinalSubmittedStatus,
} from '../types/regulatory.ts';
import { submissionService } from '../services/submissionService.ts';
import { getReportByKey } from '../data/report-registry.ts';
import { userService } from '../services/userService.ts';
import { triggerHaptic, vibrate } from '../utils/haptics.ts';

interface MakerLibraryViewProps {
  currentUser: UserSession;
  templates: ReportMetadata[];
  submissions: ReportSubmission[];
  onSelectSubmission: (submission: ReportSubmission) => void;
  onCreateDraft?: (reportKey: string) => void;
  onSubmitToChecker: (submissionId: string, comment?: string) => void;
  onDeleteSubmission: (submissionId: string) => void;
  onReuseSubmission: (submissionId: string) => void;
  onRefresh?: () => void;
}

export const MakerLibraryView: React.FC<MakerLibraryViewProps> = ({
  currentUser,
  templates,
  submissions,
  onSelectSubmission,
  onCreateDraft,
  onSubmitToChecker,
  onDeleteSubmission,
  onReuseSubmission,
  onRefresh,
}) => {
  // Query state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLifecycleState, setSelectedLifecycleState] = useState<LibraryLifecycleState | 'ALL'>('ALL');
  const [selectedReportType, setSelectedReportType] = useState<string>('ALL');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'reportKey' | 'title' | 'status' | 'version'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // UI interaction state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [deleteTargetSub, setDeleteTargetSub] = useState<ReportSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [submitTargetSub, setSubmitTargetSub] = useState<ReportSubmission | null>(null);
  const [submitComment, setSubmitComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validateTargetSub, setValidateTargetSub] = useState<ReportSubmission | null>(null);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);

  // Local query result derived directly from authoritative backend submissionService
  const queryResult: LibraryQueryResult = useMemo(() => {
    try {
      return submissionService.queryLibrary(currentUser, {
        search: searchQuery,
        lifecycleState: selectedLifecycleState,
        reportType: selectedReportType !== 'ALL' ? selectedReportType : undefined,
        frequency: selectedFrequency !== 'ALL' ? selectedFrequency : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      });
    } catch (err: any) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize,
        totalPages: 1,
        stats: { all: 0, draft: 0, inProgress: 0, returned: 0, submitted: 0, reusedCopy: 0 },
      };
    }
  }, [
    currentUser,
    submissions,
    searchQuery,
    selectedLifecycleState,
    selectedReportType,
    selectedFrequency,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
  ]);

  // Allowed report keys for this Maker
  const allowedReportKeys = useMemo(
    () => userService.getAllowedReportKeysForUser(currentUser),
    [currentUser]
  );

  const authorizedTemplates = useMemo(
    () => templates.filter((tpl) => allowedReportKeys.includes(tpl.ReturnKey)),
    [templates, allowedReportKeys]
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLifecycleState, selectedReportType, selectedFrequency, startDate, endDate, sortBy, sortOrder]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    triggerHaptic('selection');
    setTimeout(() => {
      if (onRefresh) onRefresh();
      setIsLoading(false);
    }, 250);
  }, [onRefresh]);

  const handleExecuteDelete = () => {
    if (!deleteTargetSub) return;
    setIsDeleting(true);
    try {
      vibrate([40, 60]);
      onDeleteSubmission(deleteTargetSub.id);
      setDeleteTargetSub(null);
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExecuteSubmit = () => {
    if (!submitTargetSub) return;
    setIsSubmitting(true);
    try {
      vibrate([30, 45]);
      onSubmitToChecker(submitTargetSub.id, submitComment);
      setSubmitTargetSub(null);
      setSubmitComment('');
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteValidate = (sub: ReportSubmission) => {
    setValidateTargetSub(sub);
    setIsValidating(true);
    try {
      vibrate(25);
      const res = submissionService.validateSubmission(sub.id);
      setValidationResult(res);
    } catch (err: any) {
      alert(`Validation failed: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteReuse = (sub: ReportSubmission) => {
    try {
      vibrate([30, 45]);
      onReuseSubmission(sub.id);
    } catch (err: any) {
      alert(`Reuse failed: ${err.message}`);
    }
  };

  // Lifecycle state badge styling
  const renderLifecycleBadge = (state: LibraryLifecycleState) => {
    switch (state) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            DRAFT
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Edit3 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            IN PROGRESS
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
            <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            RETURNED FOR CORRECTION
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            SUBMITTED / SEALED
          </span>
        );
      case 'REUSED_COPY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Copy className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            REUSED COPY
          </span>
        );
      default:
        return null;
    }
  };

  const isEditable = (sub: ReportSubmission) => {
    return sub.status === 'DRAFT' || sub.status === 'CORRECTION_REQUIRED';
  };

  const isSubmittedState = (sub: ReportSubmission) => {
    return (
      sub.status === 'PENDING_CHECKER' ||
      sub.status === 'APPROVED' ||
      sub.status === 'SENT' ||
      sub.status === 'SENDING'
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-ob-blue-50 dark:bg-ob-blue-950/60 text-ob-blue-600 dark:text-ob-blue-400 flex items-center justify-center border border-ob-blue-200 dark:border-ob-blue-800">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Maker Library & Regulatory Dossiers
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    SSOT Authoritative
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive lifecycle archive of unsubmitted drafts, in-progress returns, returned corrections, and immutable submitted filings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh Library Records"
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-ob-blue-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {onCreateDraft && (
              <button
                type="button"
                onClick={() => setIsNewReturnModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-ob-blue-600 hover:bg-ob-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-ob-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Return</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Lifecycle Stats Bar (Interactive Quick Filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setSelectedLifecycleState('ALL')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedLifecycleState === 'ALL'
                ? 'bg-ob-blue-50/80 dark:bg-ob-blue-950/40 border-ob-blue-400 dark:border-ob-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">All Dossiers</div>
            <div className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
              {queryResult.stats.all}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedLifecycleState('DRAFT')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedLifecycleState === 'DRAFT'
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-500 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Drafts
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {queryResult.stats.draft}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedLifecycleState('IN_PROGRESS')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedLifecycleState === 'IN_PROGRESS'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Edit3 className="w-2.5 h-2.5" />
              In Progress
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-blue-700 dark:text-blue-300 mt-0.5">
              {queryResult.stats.inProgress}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedLifecycleState('RETURNED')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              selectedLifecycleState === 'RETURNED'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" />
              Returned
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-amber-700 dark:text-amber-300 mt-0.5 flex items-center gap-1.5">
              {queryResult.stats.returned}
              {queryResult.stats.returned > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedLifecycleState('SUBMITTED')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedLifecycleState === 'SUBMITTED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Submitted
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              {queryResult.stats.submitted}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedLifecycleState('REUSED_COPY')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedLifecycleState === 'REUSED_COPY'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
              <Copy className="w-2.5 h-2.5" />
              Reused Copies
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-purple-700 dark:text-purple-300 mt-0.5">
              {queryResult.stats.reusedCopy}
            </div>
          </button>
        </div>
      </div>

      {/* 3. Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by report code, title, category, author, or NBE ref..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ob-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Report Category / Type Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ob-blue-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {Array.from(new Set(templates.map((t) => t.Category).filter(Boolean))).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Frequency Dropdown */}
            <select
              value={selectedFrequency}
              onChange={(e) => setSelectedFrequency(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ob-blue-500 cursor-pointer"
            >
              <option value="ALL">All Frequencies</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ob-blue-500 cursor-pointer"
            >
              <option value="updatedAt">Sort: Last Updated</option>
              <option value="createdAt">Sort: Created Date</option>
              <option value="reportKey">Sort: Return Code</option>
              <option value="title">Sort: Title</option>
              <option value="version">Sort: Version</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              title={`Sorting ${sortOrder.toUpperCase()}`}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'GRID'
                    ? 'bg-white dark:bg-slate-700 text-ob-blue-600 dark:text-ob-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white dark:bg-slate-700 text-ob-blue-600 dark:text-ob-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Compact Table View"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Sub-Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-ob-blue-500"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-ob-blue-500"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[11px] text-ob-blue-600 dark:text-ob-blue-400 hover:underline cursor-pointer ml-1"
              >
                Clear Dates
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{queryResult.items.length}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{queryResult.total}</strong> records
            </span>
            {(searchQuery || selectedLifecycleState !== 'ALL' || selectedReportType !== 'ALL' || selectedFrequency !== 'ALL' || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLifecycleState('ALL');
                  setSelectedReportType('ALL');
                  setSelectedFrequency('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer ml-2"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Body: Cards Grid or Table */}
      {queryResult.items.length === 0 ? (
        /* Empty State */
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mb-1">
            No Regulatory Returns Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            {searchQuery || selectedLifecycleState !== 'ALL' || selectedReportType !== 'ALL' || startDate || endDate
              ? 'No reports match your selected search criteria or lifecycle filters. Try broadening your parameters.'
              : 'Your department library currently has no active returns or drafts.'}
          </p>
          <div className="flex items-center gap-2">
            {(searchQuery || selectedLifecycleState !== 'ALL' || selectedReportType !== 'ALL' || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLifecycleState('ALL');
                  setSelectedReportType('ALL');
                  setSelectedFrequency('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            {onCreateDraft && (
              <button
                type="button"
                onClick={() => setIsNewReturnModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-ob-blue-600 hover:bg-ob-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Create New Return
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'GRID' ? (
        /* Cards View (Grid) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {queryResult.items.map((sub) => {
            const report = getReportByKey(sub.reportKey);
            const title = report?.Title || sub.reportKey;
            const lState = deriveLibraryLifecycleState(sub);
            const editable = isEditable(sub);
            const submitted = isSubmittedState(sub);

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-ob-blue-600 dark:text-ob-blue-400">
                          {sub.reportKey}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          v{sub.version}
                        </span>
                        {sub.reusedFromSubmissionId && (
                          <span
                            title={`Reused from Return (v${sub.reusedFromVersion || 1})`}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-0.5"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            REUSED
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                        {title}
                      </h4>
                    </div>
                    {renderLifecycleBadge(lState)}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {report?.Description || 'Statutory regulatory return prepared under NBE Directive BSD/03/2020.'}
                  </p>
                </div>

                {/* Metadata & Status */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 space-y-1.5 text-[11px] border border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold truncate max-w-[180px]">
                      {sub.department || report?.department || 'Credit Operations'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Prepared By:</span>
                    <span className="font-medium truncate max-w-[180px]">{sub.makerName}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Last Updated:</span>
                    <span className="font-mono text-[10px]">
                      {new Date(sub.updatedAt || sub.createdAt).toLocaleDateString()}{' '}
                      {new Date(sub.updatedAt || sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {sub.nbeReferenceNumber && (
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-mono text-[10px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>NBE Receipt:</span>
                      <span className="font-bold">{sub.nbeReferenceNumber}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {editable ? (
                      /* Continue / Open for Edit */
                      <button
                        type="button"
                        onClick={() => onSelectSubmission(sub)}
                        className="px-3 py-1.5 rounded-xl bg-ob-blue-600 hover:bg-ob-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Continue</span>
                      </button>
                    ) : (
                      /* View Read-Only for Submitted */
                      <button
                        type="button"
                        onClick={() => onSelectSubmission(sub)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    )}

                    {/* Validate Button for Drafts */}
                    {editable && (
                      <button
                        type="button"
                        onClick={() => handleExecuteValidate(sub)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Validate against NBE rules"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Validate</span>
                      </button>
                    )}

                    {/* Submit Button for Drafts */}
                    {editable && (
                      <button
                        type="button"
                        onClick={() => setSubmitTargetSub(sub)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Submit to Checker review"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Submit</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Reuse Button for Submitted Returns (Requirement 4) */}
                    {submitted && (
                      <button
                        type="button"
                        onClick={() => handleExecuteReuse(sub)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Reuse return baseline to create a new draft"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Reuse as New</span>
                      </button>
                    )}

                    {/* Delete Action (Strictly for unsubmitted drafts only! Requirements 5, 6, 9) */}
                    {editable && (
                      <button
                        type="button"
                        onClick={() => setDeleteTargetSub(sub)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete unsubmitted draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View (Compact) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Code & Title</th>
                  <th className="py-3 px-3">Lifecycle State</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Ver</th>
                  <th className="py-3 px-3">Prepared By</th>
                  <th className="py-3 px-3">Last Modified</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {queryResult.items.map((sub) => {
                  const report = getReportByKey(sub.reportKey);
                  const title = report?.Title || sub.reportKey;
                  const lState = deriveLibraryLifecycleState(sub);
                  const editable = isEditable(sub);
                  const submitted = isSubmittedState(sub);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-ob-blue-600 dark:text-ob-blue-400">
                            {sub.reportKey}
                          </span>
                          {sub.reusedFromSubmissionId && (
                            <span className="text-[9px] font-mono px-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                              REUSED
                            </span>
                          )}
                        </div>
                        <div className="text-slate-900 dark:text-white font-medium line-clamp-1 max-w-xs">
                          {title}
                        </div>
                      </td>

                      <td className="py-3 px-3">{renderLifecycleBadge(lState)}</td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {sub.department || report?.department || 'Credit Operations'}
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        v{sub.version}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {sub.makerName}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(sub.updatedAt || sub.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {editable ? (
                            <button
                              type="button"
                              onClick={() => onSelectSubmission(sub)}
                              className="px-2.5 py-1 rounded-lg bg-ob-blue-600 hover:bg-ob-blue-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Edit
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectSubmission(sub)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer"
                            >
                              View
                            </button>
                          )}

                          {editable && (
                            <button
                              type="button"
                              onClick={() => handleExecuteValidate(sub)}
                              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                              title="Validate"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          )}

                          {editable && (
                            <button
                              type="button"
                              onClick={() => setSubmitTargetSub(sub)}
                              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              title="Submit to Checker"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {submitted && (
                            <button
                              type="button"
                              onClick={() => handleExecuteReuse(sub)}
                              className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-[11px] font-semibold cursor-pointer"
                              title="Reuse as New"
                            >
                              Reuse
                            </button>
                          )}

                          {/* Delete Action (Strictly for unsubmitted drafts only!) */}
                          {editable && (
                            <button
                              type="button"
                              onClick={() => setDeleteTargetSub(sub)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                              title="Delete draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination Controls */}
      {queryResult.totalPages > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
            >
              <option value="6">6</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
              Page {queryResult.page} of {queryResult.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(queryResult.totalPages, p + 1))}
              disabled={currentPage >= queryResult.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Dialog (Requirement 9) */}
      {deleteTargetSub && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Deletion of Saved Draft
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to permanently delete this unsubmitted report draft?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-1 border border-slate-200 dark:border-slate-700">
              <div className="font-mono font-bold text-ob-blue-600 dark:text-ob-blue-400">
                {deleteTargetSub.reportKey} (v{deleteTargetSub.version})
              </div>
              <div className="text-slate-700 dark:text-slate-300 font-medium">
                {getReportByKey(deleteTargetSub.reportKey)?.Title}
              </div>
              <div className="text-slate-400 text-[10px]">
                Status: {deleteTargetSub.status} • Last Saved:{' '}
                {new Date(deleteTargetSub.updatedAt || deleteTargetSub.createdAt).toLocaleString()}
              </div>
            </div>

            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              ⚠️ Warning: This action cannot be reversed. All unsubmitted changes will be purged from the repository.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTargetSub(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Submit to Checker Modal */}
      {submitTargetSub && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                <Send className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Submit Return to Checker Queue
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submit <strong className="font-mono text-slate-700 dark:text-slate-300">{submitTargetSub.reportKey}</strong> for 4-eyes principle verification.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Maker Preparation Notes / Comments
              </label>
              <textarea
                value={submitComment}
                onChange={(e) => setSubmitComment(e.target.value)}
                placeholder="Detail verification steps, reconciliation notes, or ledger references..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-ob-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSubmitTargetSub(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Validation Inspection Modal */}
      {validateTargetSub && validationResult && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    validationResult.isValid
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Validation Summary: {validateTargetSub.reportKey}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    NBE Directive validation engines & mathematical integrity checks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValidateTargetSub(null);
                  setValidationResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span>
                {validationResult.isValid ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                    ✓ All statutory rules satisfied
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-bold">
                    {validationResult.errors?.length || 0} validation issue(s) detected
                  </span>
                )}
              </div>

              {validationResult.errors && validationResult.errors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Issues list:</span>
                  {validationResult.errors.map((err: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs"
                    >
                      <div className="font-bold">{err.ruleName || err.code || 'Validation Error'}</div>
                      <div className="text-[11px] opacity-90 mt-0.5">{err.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setValidateTargetSub(null);
                  setValidationResult(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Quick New Return Draft Modal */}
      {isNewReturnModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-ob-blue-50 dark:bg-ob-blue-950/60 text-ob-blue-600 dark:text-ob-blue-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Initiate New Regulatory Return Draft
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select an authorized template from your department's catalog
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {authorizedTemplates.map((tpl) => (
                <div
                  key={tpl.ReturnKey}
                  onClick={() => {
                    if (onCreateDraft) onCreateDraft(tpl.ReturnKey);
                    setIsNewReturnModalOpen(false);
                  }}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-ob-blue-400 dark:hover:border-ob-blue-600 hover:bg-ob-blue-50/50 dark:hover:bg-ob-blue-950/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ob-blue-600 dark:text-ob-blue-400">
                        {tpl.Code}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {tpl.Frequency}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      {tpl.Title}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-ob-blue-600 text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsNewReturnModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
