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
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  FileText,
  UserCheck,
  AlertCircle,
  Eye,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  X,
  Building2,
  Lock,
} from 'lucide-react';
import { ValidationEngine } from '../utils/validationEngine.ts';
import { Pagination } from './Pagination.tsx';
import { PdfReportGenerator } from '../utils/pdfReportGenerator.ts';

interface CheckerInboxProps {
  submissions: ReportSubmission[];
  templates: ReportMetadata[];
  currentUser: UserSession;
  onReviewSubmission: (
    submissionId: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION',
    comment: string
  ) => void;
  onDeliverToNBE: (submissionId: string) => Promise<any>;
  onSwitchUser: (user: UserSession) => void;
  checkerUser: UserSession;
}

export const CheckerInbox: React.FC<CheckerInboxProps> = ({
  submissions,
  templates,
  currentUser,
  onReviewSubmission,
  onDeliverToNBE,
  onSwitchUser,
  checkerUser,
}) => {
  const [selectedSubForReview, setSelectedSubForReview] = useState<ReportSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING_CHECKER');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<any | null>(null);

  // Pagination state - 6 items per page keeps display neatly balanced
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const isChecker = currentUser.role === 'CHECKER' || currentUser.role === 'ADMIN';

  const categories = ['ALL', ...Array.from(new Set(templates.map((t) => t.Category || 'General')))];

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const tpl = templates.find((t) => t.ReturnKey === sub.reportKey);
    const title = tpl ? tpl.Title : sub.reportKey;
    const cat = tpl ? tpl.Category : 'General';

    const matchesStatus = filterStatus === 'ALL' || sub.status === filterStatus;
    const matchesCategory = filterCategory === 'ALL' || cat === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sub.reportKey.toLowerCase().includes(q) ||
      title.toLowerCase().includes(q) ||
      sub.makerName.toLowerCase().includes(q);

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterCategory, searchQuery]);

  const paginatedSubmissions = filteredSubmissions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const pendingCount = submissions.filter((s) => s.status === 'PENDING_CHECKER').length;
  const approvedCount = submissions.filter((s) => s.status === 'APPROVED').length;
  const sentCount = submissions.filter((s) => s.status === 'SENT').length;
  const correctionCount = submissions.filter((s) => s.status === 'CORRECTION_REQUIRED').length;

  const handleOpenReview = (sub: ReportSubmission) => {
    setSelectedSubForReview(sub);
    setReviewAction(null);
    setReviewComment('');
    setDeliveryResult(null);
  };

  const handleSubmitReview = (action: 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION') => {
    if (!selectedSubForReview) return;
    if (selectedSubForReview.makerId === currentUser.id && currentUser.role !== 'ADMIN') {
      alert('Segregation of Duties Violation: You cannot approve a submission that you created as Maker.');
      return;
    }
    onReviewSubmission(selectedSubForReview.id, action, reviewComment || `${action} sign-off by ${currentUser.name}`);
    setSelectedSubForReview(null);
  };

  const handleDeliver = async (subId: string) => {
    setIsDelivering(true);
    try {
      const res = await onDeliverToNBE(subId);
      setDeliveryResult(res);
    } catch (err: any) {
      setDeliveryResult({ success: false, error: err.message });
    } finally {
      setIsDelivering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Draft
          </span>
        );
      case 'PENDING_CHECKER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Sign-off
          </span>
        );
      case 'CORRECTION_REQUIRED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Correction Req.
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
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Delivered NBE
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

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-2.5 font-sans">
      {/* 1. Compact Top Metrics Ribbon (~54px, Fixed Height) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">Pending Sign-off</span>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-400 leading-tight">{pendingCount}</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Awaiting 4-eyes review</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Approved Returns</span>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 leading-tight">{approvedCount}</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Ready for transmission</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">Sent for Correction</span>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-400 leading-tight">{correctionCount}</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Returned to Makers</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">Delivered to NBE</span>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-400 leading-tight">{sentCount}</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Intake confirmed</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 2. Segregation of Duties Warning Banner (Only if logged in as Maker) */}
      {!isChecker && (
        <div className="bg-amber-50/90 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 shadow-2xs shrink-0 transition-colors">
          <div className="flex items-center gap-2 text-xs">
            <Shield className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="text-amber-900 dark:text-amber-200 font-semibold">
              Segregation of Duties Enforced: You are logged in as {currentUser.name} (MAKER). Sign-offs must be executed by an authorized Checker.
            </span>
          </div>
          <button
            onClick={() => onSwitchUser(checkerUser)}
            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer"
          >
            Switch to Checker
          </button>
        </div>
      )}

      {/* 3. Filter Navigation Strip (Fixed Height) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 shrink-0 transition-colors">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['PENDING_CHECKER', 'APPROVED', 'CORRECTION_REQUIRED', 'SENT', 'ALL'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-ob-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'PENDING_CHECKER'
                ? `Pending Review (${pendingCount})`
                : status === 'APPROVED'
                ? `Approved (${approvedCount})`
                : status === 'CORRECTION_REQUIRED'
                ? `Corrections (${correctionCount})`
                : status === 'SENT'
                ? `Delivered (${sentCount})`
                : 'All Submissions'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer shadow-2xs"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="dark:bg-slate-900">
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative w-40 sm:w-48">
            <input
              type="text"
              placeholder="Search maker, return..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 shadow-2xs"
            />
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden lg:inline-block">
            {filteredSubmissions.length} returns
          </span>
        </div>
      </div>

      {/* 4. Submissions Review Queue Table (Strict flex-1 min-h-0 overflow-hidden) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs transition-colors">
        <div className="flex-1 min-h-0 overflow-y-auto">
          {paginatedSubmissions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Queue is Clear</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No returns match the selected filter category.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 z-10">
                  <th className="py-2 px-3">Return Code</th>
                  <th className="py-2 px-3">Report Title</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Period & Version</th>
                  <th className="py-2 px-3">Prepared By (Maker)</th>
                  <th className="py-2 px-3">Validation Summary</th>
                  <th className="py-2 px-3 text-right">Checker Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedSubmissions.map((sub) => {
                  const tpl = templates.find((t) => t.ReturnKey === sub.reportKey);
                  const valSummary = tpl ? ValidationEngine.validateReport(tpl, sub.values, sub.dynamicRows) : null;
                  const isOwnSubmission = sub.makerId === currentUser.id && currentUser.role !== 'ADMIN';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-ob-indigo-700 dark:text-ob-indigo-300">
                        {sub.reportKey}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate" title={tpl?.Title}>
                        {tpl?.Title || sub.reportKey}
                      </td>

                      <td className="py-2.5 px-3">{getStatusBadge(sub.status)}</td>

                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                        {sub.periodYear} (v{sub.version})
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {sub.makerName}
                      </td>

                      <td className="py-2.5 px-3">
                        {valSummary ? (
                          valSummary.isValid ? (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Rules Pass (100%)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              {valSummary.errorsCount} Error{valSummary.errorsCount > 1 ? 's' : ''}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">Unchecked</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(sub)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>

                        {sub.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleDeliver(sub.id)}
                            disabled={isDelivering}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            title="Deliver Approved Return to NBE Gateway"
                          >
                            <Send className="w-3 h-3" />
                            <span>{isDelivering ? 'Sending...' : 'Deliver NBE'}</span>
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
            currentPage={page}
            totalItems={filteredSubmissions.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 6, 10, 20]}
          />
        </div>
      </div>

      {/* 5. Inspection & 4-Eyes Review Drawer / Modal */}
      {selectedSubForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ob-indigo-700 dark:text-ob-indigo-300 bg-ob-indigo-50 dark:bg-ob-indigo-950 px-1.5 py-0.2 rounded border border-ob-indigo-200 dark:border-ob-indigo-800">
                      {selectedSubForReview.reportKey}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Prudential Sign-Off & Review
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Prepared by {selectedSubForReview.makerName} · Version {selectedSubForReview.version}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(selectedSubForReview.status === 'APPROVED' || selectedSubForReview.status === 'SENT') && (
                  <button
                    type="button"
                    onClick={() => {
                      const tpl = templates.find((t) => t.ReturnKey === selectedSubForReview.reportKey);
                      if (tpl) PdfReportGenerator.generateReturnPdf(tpl, selectedSubForReview);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-ob-indigo-700 dark:text-ob-indigo-300 bg-ob-indigo-50 dark:bg-ob-indigo-950 hover:bg-ob-indigo-100 dark:hover:bg-ob-indigo-900 border border-ob-indigo-300 dark:border-ob-indigo-800 rounded-lg transition-colors cursor-pointer"
                    title="Download Official PDF Report"
                  >
                    <FileText className="w-3.5 h-3.5 text-ob-indigo-600 dark:text-ob-indigo-400" />
                    <span>PDF</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedSubForReview(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Delivery Receipt Notification if just sent */}
              {deliveryResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    deliveryResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {deliveryResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>{deliveryResult.success ? 'NBE Intake Confirmed!' : 'NBE Delivery Failed'}</span>
                  </div>
                  <div className="font-mono text-[11px]">
                    Receipt Token: {deliveryResult.response?.submissionReceiptNumber || deliveryResult.response?.receiptNumber || 'CONFIRMED'}
                  </div>
                </div>
              )}

              {/* Status and Segregation warning */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 dark:text-slate-400 text-[10px] uppercase font-bold block">Current Status</span>
                  <div className="mt-1">{getStatusBadge(selectedSubForReview.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 text-[10px] uppercase font-bold block">Maker Assignment</span>
                  <div className="text-slate-800 dark:text-slate-200 font-bold mt-1">{selectedSubForReview.makerName}</div>
                </div>
              </div>

              {/* Review Comment Box */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Checker Assessment Notes / Correction Directives:
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Enter remarks for the audit trail or specific correction instructions for the Maker..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmitReview('REQUEST_CORRECTION')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Request Corrections</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitReview('REJECT')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Return</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitReview('APPROVE')}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Sign-Off</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
