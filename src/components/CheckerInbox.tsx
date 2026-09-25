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
import { ValidationEngine } from '../utils/validationEngine';
import { Pagination } from './Pagination';

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
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<any | null>(null);

  // Pagination state - 6 items per page keeps display neatly balanced
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const isChecker = currentUser.role === 'CHECKER' || currentUser.role === 'ADMIN';

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (filterStatus === 'ALL') return true;
    return sub.status === filterStatus;
  });

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filterStatus]);

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
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Draft
          </span>
        );
      case 'PENDING_CHECKER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Sign-off
          </span>
        );
      case 'CORRECTION_REQUIRED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Correction Req.
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
            Delivered NBE
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

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-2.5 font-sans">
      {/* 1. Compact Top Metrics Ribbon (~54px, Fixed Height) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending Sign-off</span>
            <div className="text-lg font-bold text-amber-700 leading-tight">{pendingCount}</div>
            <span className="text-[10px] text-slate-500">Awaiting 4-eyes review</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Approved Returns</span>
            <div className="text-lg font-bold text-emerald-700 leading-tight">{approvedCount}</div>
            <span className="text-[10px] text-slate-500">Ready for transmission</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Sent for Correction</span>
            <div className="text-lg font-bold text-rose-700 leading-tight">{correctionCount}</div>
            <span className="text-[10px] text-slate-500">Returned to Makers</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Delivered to NBE</span>
            <div className="text-lg font-bold text-purple-700 leading-tight">{sentCount}</div>
            <span className="text-[10px] text-slate-500">Intake confirmed</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 2. Segregation of Duties Warning Banner (Only if logged in as Maker) */}
      {!isChecker && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 shadow-2xs shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Shield className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-amber-900 font-semibold">
              Segregation of Duties Enforced: You are logged in as {currentUser.name} (MAKER). Sign-offs must be executed by an authorized Checker.
            </span>
          </div>
          <button
            onClick={() => onSwitchUser(checkerUser)}
            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors shadow-2xs"
          >
            Switch to Checker
          </button>
        </div>
      )}

      {/* 3. Filter Navigation Strip (Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          {(['PENDING_CHECKER', 'APPROVED', 'CORRECTION_REQUIRED', 'SENT', 'ALL'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === status
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

        <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
          Showing {paginatedSubmissions.length} of {filteredSubmissions.length}
        </span>
      </div>

      {/* 4. Submissions Review Queue Table (Strict flex-1 min-h-0 overflow-hidden) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex-1 min-h-0 overflow-y-auto">
          {paginatedSubmissions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Queue is Clear</h3>
              <p className="text-xs text-slate-500 mt-1">No returns match the selected filter category.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10">
                  <th className="py-2 px-3">Return Code</th>
                  <th className="py-2 px-3">Report Title</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Period & Version</th>
                  <th className="py-2 px-3">Prepared By (Maker)</th>
                  <th className="py-2 px-3">Validation Summary</th>
                  <th className="py-2 px-3 text-right">Checker Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSubmissions.map((sub) => {
                  const tpl = templates.find((t) => t.ReturnKey === sub.reportKey);
                  const valSummary = tpl ? ValidationEngine.validateReport(tpl, sub.values, sub.dynamicRows) : null;
                  const isOwnSubmission = sub.makerId === currentUser.id && currentUser.role !== 'ADMIN';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700">
                        {sub.reportKey}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900 max-w-xs truncate" title={tpl?.Title}>
                        {tpl?.Title || sub.reportKey}
                      </td>

                      <td className="py-2.5 px-3">{getStatusBadge(sub.status)}</td>

                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        {sub.periodYear} (v{sub.version})
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {sub.makerName}
                      </td>

                      <td className="py-2.5 px-3">
                        {valSummary ? (
                          valSummary.isValid ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Rules Pass (100%)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              {valSummary.errorsCount} Error{valSummary.errorsCount > 1 ? 's' : ''}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[10px]">Unchecked</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(sub)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>

                        {sub.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleDeliver(sub.id)}
                            disabled={isDelivering}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1 disabled:opacity-50"
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
        <div className="shrink-0 p-2 border-t border-slate-200 bg-slate-50/50">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                      {selectedSubForReview.reportKey}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Prudential Sign-Off & Review
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Prepared by {selectedSubForReview.makerName} · Version {selectedSubForReview.version}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubForReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Delivery Receipt Notification if just sent */}
              {deliveryResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    deliveryResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {deliveryResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{deliveryResult.success ? 'NBE Intake Confirmed!' : 'NBE Delivery Failed'}</span>
                  </div>
                  <div className="font-mono text-[11px]">
                    Receipt Token: {deliveryResult.response?.submissionReceiptNumber || deliveryResult.response?.receiptNumber || 'CONFIRMED'}
                  </div>
                </div>
              )}

              {/* Status and Segregation warning */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Status</span>
                  <div className="mt-1">{getStatusBadge(selectedSubForReview.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Maker Assignment</span>
                  <div className="text-slate-800 font-bold mt-1">{selectedSubForReview.makerName}</div>
                </div>
              </div>

              {/* Review Comment Box */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Checker Assessment Notes / Correction Directives:
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Enter remarks for the audit trail or specific correction instructions for the Maker..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmitReview('REQUEST_CORRECTION')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Request Corrections</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitReview('REJECT')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Return</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitReview('APPROVE')}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
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
