/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Send,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Check,
} from 'lucide-react';
import { UserSession, ReportSubmission, EligibleCheckerSummary } from '../types/regulatory.ts';
import { userService } from '../services/userService.ts';
import { vibrate } from '../utils/haptics.ts';

export interface CheckerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string, selectedCheckerIds: string[]) => void;
  reportKey: string;
  reportTitle?: string;
  submission?: ReportSubmission | null;
  currentUser: UserSession;
  isResubmission?: boolean;
}

export const CheckerSelectorModal: React.FC<CheckerSelectorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  reportKey,
  reportTitle,
  submission,
  currentUser,
  isResubmission = false,
}) => {
  const [comment, setComment] = useState('');
  const [selectedCheckerIds, setSelectedCheckerIds] = useState<string[]>([]);
  const [confirmedMandatory, setConfirmedMandatory] = useState(true);
  const [eligibleCheckers, setEligibleCheckers] = useState<EligibleCheckerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load eligible checkers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    try {
      const checkers = userService.getEligibleCheckersForSubmission(
        currentUser,
        reportKey,
        submission || undefined
      );
      setEligibleCheckers(checkers as EligibleCheckerSummary[]);

      // Pre-select already assigned checkers or default to first eligible
      if (submission?.assignedCheckerIds && submission.assignedCheckerIds.length > 0) {
        const validAssigned = submission.assignedCheckerIds.filter((id) =>
          checkers.some((c: any) => c.id === id)
        );
        setSelectedCheckerIds(validAssigned.length > 0 ? validAssigned : checkers.slice(0, 1).map((c: any) => c.id));
      } else if (checkers.length > 0) {
        setSelectedCheckerIds([checkers[0].id]);
      } else {
        setSelectedCheckerIds([]);
      }
    } catch {
      setEligibleCheckers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, reportKey, currentUser, submission]);

  // Handle toggling checker selection
  const handleToggleChecker = (checkerId: string) => {
    vibrate(20);
    setSelectedCheckerIds((prev) => {
      if (prev.includes(checkerId)) {
        return prev.filter((id) => id !== checkerId);
      } else {
        return [...prev, checkerId];
      }
    });
  };

  const handleSelectAll = () => {
    vibrate(20);
    setSelectedCheckerIds(eligibleCheckers.map((c) => c.id));
  };

  const handleClearSelection = () => {
    vibrate(20);
    setSelectedCheckerIds([]);
  };

  const handleRemoveChip = (checkerId: string) => {
    vibrate(15);
    setSelectedCheckerIds((prev) => prev.filter((id) => id !== checkerId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCheckerIds.length === 0) return;
    vibrate([30, 45, 40]);
    onSubmit(comment, selectedCheckerIds);
    onClose();
  };

  // Map selected IDs to Checker objects
  const selectedCheckerObjects = useMemo(() => {
    return selectedCheckerIds
      .map((id) => eligibleCheckers.find((c) => c.id === id))
      .filter((c): c is EligibleCheckerSummary => Boolean(c));
  }, [selectedCheckerIds, eligibleCheckers]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checker-selector-title"
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-ob-blue-50 dark:bg-ob-blue-950/40 text-ob-blue-600 dark:text-ob-blue-400 flex items-center justify-center shrink-0 border border-ob-blue-200 dark:border-ob-blue-800">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-ob-blue-100/70 dark:bg-ob-blue-900/50 text-ob-blue-800 dark:text-ob-blue-300 mb-1">
                NBE 4-EYES PRINCIPLE BSD/03/2020
              </div>
              <h3
                id="checker-selector-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {isResubmission ? 'Resubmit Return for 4-Eyes Review' : 'Submit Return for 4-Eyes Review'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <strong className="font-mono text-slate-700 dark:text-slate-300">{reportKey}</strong>
                {reportTitle ? ` — ${reportTitle}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section: Select Checker(s) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-ob-blue-600 dark:text-ob-blue-400" />
                  Select Checker(s)
                </label>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {eligibleCheckers.length} eligible
                </span>
              </div>
              {eligibleCheckers.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-ob-blue-600 dark:text-ob-blue-400 hover:underline font-medium text-[11px] cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-[11px] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Checkers List or Empty State */}
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                Evaluating server-side reviewer eligibility...
              </div>
            ) : eligibleCheckers.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      No Eligible Checkers Available
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      There are currently no active registered Checkers in{' '}
                      <strong>{currentUser.department || 'your department'}</strong> authorized to
                      review this return. Under NBE prudential standards, at least one Checker must
                      be assigned. Please contact your Compliance Administrator to assign a Checker.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {eligibleCheckers.map((chk, index) => {
                  const isSelected = selectedCheckerIds.includes(chk.id);
                  const isPrimary = selectedCheckerIds[0] === chk.id;
                  return (
                    <div
                      key={chk.id}
                      onClick={() => handleToggleChecker(chk.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-ob-blue-500 bg-ob-blue-50/50 dark:bg-ob-blue-950/30 dark:border-ob-blue-600'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                            isSelected
                              ? 'bg-ob-blue-600 border-ob-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {chk.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {chk.employeeId}
                            </span>
                            {isPrimary && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-ob-blue-100 dark:bg-ob-blue-900/60 text-ob-blue-800 dark:text-ob-blue-300">
                                Primary Reviewer
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {chk.department}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                        {chk.authorizedVia === 'SPECIAL_ACCESS' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Special Grant
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Reviewer Chips */}
            {selectedCheckerObjects.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Selected Reviewer(s):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCheckerObjects.map((c, idx) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    >
                      <span>
                        {c.name} {idx === 0 && <strong className="text-ob-blue-600 dark:text-ob-blue-400">(Primary)</strong>}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChip(c.id)}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Remove Checker"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Maker Remarks / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Maker Remarks / Reconciliation Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Detail verification steps, reconciliation notes, or ledger references for the reviewing Checker..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-ob-blue-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Mandatory Selection Confirmation Note */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-ob-blue-600 dark:text-ob-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Upon submission, authoritative workflow notifications will be dispatched to each
              selected Checker. The return data will be sealed into an immutable snapshot awaiting
              4-eyes sign-off.
            </p>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedCheckerIds.length === 0}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-xs flex items-center gap-2 ${
                selectedCheckerIds.length === 0
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-ob-blue-600 hover:bg-ob-blue-700 active:scale-95 cursor-pointer shadow-ob-blue-500/20'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {selectedCheckerIds.length === 0
                  ? 'Select a Checker to Submit'
                  : `Confirm Submission (${selectedCheckerIds.length} Checker${selectedCheckerIds.length > 1 ? 's' : ''})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
