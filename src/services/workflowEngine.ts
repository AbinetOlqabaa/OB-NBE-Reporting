/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReportSubmission, SubmissionStatus, UserSession, SubmissionComment } from '../types/regulatory.ts';

export interface TransitionResult {
  success: boolean;
  newStatus?: SubmissionStatus;
  error?: string;
  auditAction?: string;
}

export class WorkflowEngine {
  /**
   * Evaluates if a state transition is legal according to strict Maker-Checker rules.
   */
  public static canTransition(
    currentStatus: SubmissionStatus,
    targetStatus: SubmissionStatus,
    user: UserSession,
    submission: ReportSubmission
  ): TransitionResult {
    // Rule: Segregation of Duties - Maker cannot approve their own report
    if (targetStatus === 'APPROVED' && user.id === submission.makerId) {
      return {
        success: false,
        error: 'Segregation of duties violation: Maker cannot approve their own submission.',
      };
    }

    // Role-based state transitions
    switch (currentStatus) {
      case 'DRAFT':
      case 'CORRECTION_REQUIRED':
        if (targetStatus === 'PENDING_CHECKER') {
          if (user.role !== 'MAKER' && user.role !== 'ADMIN') {
            return { success: false, error: 'Only a Maker can submit reports for Checker review.' };
          }
          return { success: true, newStatus: 'PENDING_CHECKER', auditAction: 'MAKER_SUBMIT' };
        }
        if (targetStatus === 'DRAFT') {
          return { success: true, newStatus: 'DRAFT', auditAction: 'SAVE_DRAFT' };
        }
        return { success: false, error: `Illegal transition from ${currentStatus} to ${targetStatus}` };

      case 'PENDING_CHECKER':
        if (user.role !== 'CHECKER' && user.role !== 'ADMIN') {
          return { success: false, error: 'Only an authorized Checker or Admin can review submissions.' };
        }
        if (targetStatus === 'APPROVED') {
          return { success: true, newStatus: 'APPROVED', auditAction: 'CHECKER_APPROVE' };
        }
        if (targetStatus === 'REJECTED') {
          return { success: true, newStatus: 'REJECTED', auditAction: 'CHECKER_REJECT' };
        }
        if (targetStatus === 'CORRECTION_REQUIRED') {
          return { success: true, newStatus: 'CORRECTION_REQUIRED', auditAction: 'REQUEST_CORRECTION' };
        }
        return { success: false, error: `Illegal transition from ${currentStatus} to ${targetStatus}` };

      case 'APPROVED':
        if (targetStatus === 'SENDING') {
          return { success: true, newStatus: 'SENDING', auditAction: 'BEGIN_NBE_DELIVERY' };
        }
        return { success: false, error: `Approved reports can only transition to SENDING for NBE delivery.` };

      case 'SENDING':
        if (targetStatus === 'SENT') {
          return { success: true, newStatus: 'SENT', auditAction: 'NBE_DELIVERY_CONFIRMED' };
        }
        if (targetStatus === 'FAILED') {
          return { success: true, newStatus: 'FAILED', auditAction: 'NBE_DELIVERY_FAILED' };
        }
        return { success: false, error: `Sending state can only resolve to SENT or FAILED.` };

      case 'FAILED':
        if (targetStatus === 'SENDING') {
          return { success: true, newStatus: 'SENDING', auditAction: 'RETRY_NBE_DELIVERY' };
        }
        if (targetStatus === 'CORRECTION_REQUIRED') {
          return { success: true, newStatus: 'CORRECTION_REQUIRED', auditAction: 'RESET_FAILED_FOR_CORRECTION' };
        }
        return { success: false, error: `Failed reports can only be retried (SENDING) or reset for correction.` };

      case 'REJECTED':
        if (targetStatus === 'DRAFT' || targetStatus === 'CORRECTION_REQUIRED') {
          return { success: true, newStatus: 'CORRECTION_REQUIRED', auditAction: 'REOPEN_REJECTED' };
        }
        return { success: false, error: `Rejected submissions cannot directly transition to ${targetStatus}.` };

      case 'SENT':
        return { success: false, error: 'Submission has already been delivered to NBE and is immutable.' };

      default:
        return { success: false, error: `Unknown submission status: ${currentStatus}` };
    }
  }

  /**
   * Applies the state transition and updates version / timestamps.
   */
  public static applyTransition(
    submission: ReportSubmission,
    targetStatus: SubmissionStatus,
    user: UserSession,
    commentText?: string
  ): { updatedSubmission: ReportSubmission; comment: SubmissionComment } {
    const check = this.canTransition(submission.status, targetStatus, user, submission);
    if (!check.success) {
      throw new Error(check.error || 'Transition denied by workflow rules');
    }

    const now = new Date().toISOString();
    const isNewVersion = targetStatus === 'CORRECTION_REQUIRED' || targetStatus === 'DRAFT';

    const comment: SubmissionComment = {
      id: 'comm_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      userName: user.name,
      userRole: user.role as any,
      comment: commentText || `Status transitioned to ${targetStatus}`,
      action:
        targetStatus === 'APPROVED'
          ? 'APPROVE'
          : targetStatus === 'REJECTED'
          ? 'REJECT'
          : targetStatus === 'CORRECTION_REQUIRED'
          ? 'REQUEST_CORRECTION'
          : targetStatus === 'PENDING_CHECKER'
          ? 'SUBMIT'
          : 'NOTE',
      timestamp: now,
    };

    const updated: ReportSubmission = {
      ...submission,
      status: targetStatus,
      version: isNewVersion ? submission.version + 1 : submission.version,
      updatedAt: now,
      submittedAt: targetStatus === 'PENDING_CHECKER' ? now : submission.submittedAt,
      reviewedAt: ['APPROVED', 'REJECTED', 'CORRECTION_REQUIRED'].includes(targetStatus) ? now : submission.reviewedAt,
      approvedAt: targetStatus === 'APPROVED' ? now : submission.approvedAt,
      checkerId: ['APPROVED', 'REJECTED', 'CORRECTION_REQUIRED'].includes(targetStatus) ? user.id : submission.checkerId,
      checkerName: ['APPROVED', 'REJECTED', 'CORRECTION_REQUIRED'].includes(targetStatus) ? user.name : submission.checkerName,
      checkerEmail: ['APPROVED', 'REJECTED', 'CORRECTION_REQUIRED'].includes(targetStatus) ? user.email : submission.checkerEmail,
      comments: [...submission.comments, comment],
    };

    return { updatedSubmission: updated, comment };
  }
}
