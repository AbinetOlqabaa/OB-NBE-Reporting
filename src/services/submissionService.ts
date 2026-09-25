/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ReportSubmission,
  SubmissionStatus,
  UserSession,
  DynamicRowRecord,
} from '../types/regulatory';
import { getReportByKey, getAllReports } from '../data/report-registry';
import { WorkflowEngine } from './workflowEngine';
import { FormulaEngine } from '../utils/formulaEngine';
import { ValidationEngine, ValidationSummary } from '../utils/validationEngine';
import { nbeAdapter, DeliveryResult } from './nbeAdapter';
import { auditService } from './auditService';

// Default Demo User Accounts
export const DEMO_USERS: UserSession[] = [
  {
    id: 'usr_maker_1',
    name: 'Abebe Kebede',
    email: 'abebe.kebede@oromiabank.com',
    role: 'MAKER',
    institutionCode: '0000013',
  },
  {
    id: 'usr_maker_2',
    name: 'Tigist Alemu',
    email: 'tigist.alemu@oromiabank.com',
    role: 'MAKER',
    institutionCode: '0000013',
  },
  {
    id: 'usr_checker_1',
    name: 'Chala Desta',
    email: 'chala.desta@oromiabank.com',
    role: 'CHECKER',
    institutionCode: '0000013',
  },
  {
    id: 'usr_admin_1',
    name: 'System Administrator',
    email: 'admin.compliance@oromiabank.com',
    role: 'ADMIN',
    institutionCode: '0000013',
  },
];

class SubmissionServiceClass {
  private submissions: Map<string, ReportSubmission> = new Map();

  constructor() {
    this.seedInitialSubmissions();
  }

  private seedInitialSubmissions(): void {
    const pobepe = getReportByKey('POBEPE001');
    if (pobepe) {
      const sub1: ReportSubmission = {
        id: 'sub_pobepe_001',
        reportKey: 'POBEPE001',
        periodYear: 2026,
        periodStart: '2026-04-01T00:00:00',
        periodEnd: '2026-06-30T00:00:00',
        institutionCode: '0000013',
        status: 'PENDING_CHECKER',
        version: 1,
        values: {
          '153_00010': 450000000,
          '153_00011': 1,
          '153_00016': 4500000,
          '153_00017': 4200000,
          '153_00018': -300000,
          '153_00019': 280000000,
          '153_00020': 0.5,
          '153_00025': 1400000,
          '153_00026': 1400000,
          '153_00027': 0,
          '153_00001': 730000000,
          '153_00007': 5900000,
          '153_00008': 5600000,
          '153_00009': -300000,
          '153_00028': 180000000,
          '153_00034': 1800000,
          '153_00037': 95000000,
          '153_00043': 950000,
          '153_00046': 45000000,
          '153_00052': 450000,
          '153_00055': 1050000000,
          '153_00061': 9100000,
          '153_00062': 8800000,
          '153_00063': -300000,
          '153_00064': 8800000,
        },
        dynamicRows: {},
        makerId: 'usr_maker_1',
        makerName: 'Abebe Kebede',
        makerEmail: 'abebe.kebede@oromiabank.com',
        comments: [
          {
            id: 'comm_init_1',
            userId: 'usr_maker_1',
            userName: 'Abebe Kebede',
            userRole: 'MAKER',
            comment: 'Off-balance sheet guarantees provision calculated based on Q2 loan ledger.',
            action: 'SUBMIT',
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
        ],
        deliveryAttempts: [],
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      };
      this.submissions.set(sub1.id, sub1);
    }

    const lc001 = getReportByKey('M_LCPLC001');
    if (lc001) {
      const sub2: ReportSubmission = {
        id: 'sub_lc001_002',
        reportKey: 'M_LCPLC001',
        periodYear: 2026,
        periodStart: '2026-07-01T00:00:00',
        periodEnd: '2026-07-31T00:00:00',
        institutionCode: '0000013',
        status: 'DRAFT',
        version: 1,
        values: {
          '122_00001': 32450000000,
          '122_00002': 4800000000,
          '122_00003': 12500000000,
          '122_00004': 17300000000,
          '122_00005': 15150000000,
          '122_00007': 151500000,
          '122_00008': 160000000,
          '122_00009': 8500000,
          '122_00046': 2400000000,
          '122_00050': 1800000000,
          '122_00052': 54000000,
          '122_00091': 680000000,
          '122_00095': 520000000,
          '122_00097': 104000000,
          '122_00190': 340000000,
          '122_00194': 250000000,
          '122_00196': 125000000,
          '122_00235': 180000000,
          '122_00239': 150000000,
          '122_00241': 150000000,
          '122_00280': 36050000000,
          '122_00289': 1200000000,
          '122_00298': 3.33,
        },
        dynamicRows: {},
        makerId: 'usr_maker_2',
        makerName: 'Tigist Alemu',
        makerEmail: 'tigist.alemu@oromiabank.com',
        comments: [
          {
            id: 'comm_init_2',
            userId: 'usr_maker_2',
            userName: 'Tigist Alemu',
            userRole: 'MAKER',
            comment: 'Draft initiated for July 2026 Monthly Loan Classification.',
            action: 'SAVE_DRAFT',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
        ],
        deliveryAttempts: [],
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      };
      this.submissions.set(sub2.id, sub2);
    }

    const tb001 = getReportByKey('TOP_20_BOR_TB001');
    if (tb001) {
      const sub3: ReportSubmission = {
        id: 'sub_tb001_003',
        reportKey: 'TOP_20_BOR_TB001',
        periodYear: 2026,
        periodStart: '2026-04-01T00:00:00',
        periodEnd: '2026-06-30T00:00:00',
        institutionCode: '0000013',
        status: 'DRAFT',
        version: 1,
        values: {
          '14_00001': 'Ethio Cement SC',
          '14_00002': 'Oromia Coffee Farmers Union',
          '14_00003': 'Muger Energy PLC',
          '14_00020': 5400000000,
          '14_00021': 4800000000,
          '14_00022': 850000000,
          '14_00023': 5650000000,
        },
        dynamicRows: {
          188: [
            {
              id: 'row_tb_1',
              areaId: 188,
              values: {
                '1.1': '1',
                '1.2': 'Ethio Cement SC',
                '1.3': 1200000000,
                '1.4': 14000000000,
                '1.5': 900000000,
                '1.6': 850000000,
                '1.7': 150000000,
                '1.8': 1000000000,
                '1.9': 7.14,
                '1.10': 'Pass',
              },
            },
            {
              id: 'row_tb_2',
              areaId: 188,
              values: {
                '1.1': '2',
                '1.2': 'Oromia Coffee Farmers Union',
                '1.3': 950000000,
                '1.4': 14000000000,
                '1.5': 800000000,
                '1.6': 750000000,
                '1.7': 200000000,
                '1.8': 950000000,
                '1.9': 6.78,
                '1.10': 'Pass',
              },
            },
          ],
        },
        makerId: 'usr_maker_1',
        makerName: 'Abebe Kebede',
        makerEmail: 'abebe.kebede@oromiabank.com',
        comments: [],
        deliveryAttempts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.submissions.set(sub3.id, sub3);
    }
  }

  public getAll(): ReportSubmission[] {
    return Array.from(this.submissions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getById(id: string): ReportSubmission | undefined {
    return this.submissions.get(id);
  }

  public getByFilter(filter: { status?: SubmissionStatus; reportKey?: string; makerId?: string }): ReportSubmission[] {
    return this.getAll().filter((s) => {
      if (filter.status && s.status !== filter.status) return false;
      if (filter.reportKey && s.reportKey !== filter.reportKey) return false;
      if (filter.makerId && s.makerId !== filter.makerId) return false;
      return true;
    });
  }

  /**
   * Creates a new submission draft for a specific report key.
   */
  public createSubmission(reportKey: string, user: UserSession): ReportSubmission {
    const report = getReportByKey(reportKey);
    if (!report) {
      throw new Error(`Report template not found for key: ${reportKey}`);
    }

    const id = 'sub_' + reportKey.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const now = new Date().toISOString();

    const initialValues: Record<string, string | number> = {};
    for (const item of report.ReturnItemsList) {
      initialValues[item.Code] = item.Value !== undefined ? item.Value : '';
    }

    const initialDynamicRows: Record<number, DynamicRowRecord[]> = {};
    for (const area of report.DynamicItemsList) {
      initialDynamicRows[area.Area] = [];
    }

    const submission: ReportSubmission = {
      id,
      reportKey: report.ReturnKey,
      periodYear: report.FinYear,
      periodStart: report.StartDate,
      periodEnd: report.EndDate,
      institutionCode: report.InstCode,
      status: 'DRAFT',
      version: 1,
      values: initialValues,
      dynamicRows: initialDynamicRows,
      makerId: user.id,
      makerName: user.name,
      makerEmail: user.email,
      comments: [
        {
          id: 'comm_' + Math.random().toString(36).substring(2, 9),
          userId: user.id,
          userName: user.name,
          userRole: user.role as any,
          comment: `Report draft created for ${report.Title}`,
          action: 'SAVE_DRAFT',
          timestamp: now,
        },
      ],
      deliveryAttempts: [],
      createdAt: now,
      updatedAt: now,
      idempotencyKey: 'idemp_' + id + '_v1',
    };

    this.submissions.set(id, submission);

    auditService.log({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'CREATE_DRAFT',
      entityType: 'REPORT_SUBMISSION',
      entityId: id,
      correlationId: 'corr_' + id,
      details: `Created new draft for report ${report.ReturnKey}`,
    });

    return submission;
  }

  /**
   * Updates an existing draft's field values and dynamic rows.
   */
  public updateDraft(
    id: string,
    values: Record<string, string | number>,
    dynamicRows: Record<number, DynamicRowRecord[]>,
    user: UserSession
  ): ReportSubmission {
    const sub = this.submissions.get(id);
    if (!sub) throw new Error(`Submission not found: ${id}`);

    if (sub.status !== 'DRAFT' && sub.status !== 'CORRECTION_REQUIRED') {
      throw new Error(`Cannot modify submission in status ${sub.status}`);
    }

    const report = getReportByKey(sub.reportKey);
    let finalValues = { ...values };

    // Auto-calculate formulas
    if (report && report.Formulas.length > 0) {
      const calcResult = FormulaEngine.calculateAllFormulas(report.Formulas, finalValues);
      finalValues = calcResult.updatedValues;
    }

    const updated: ReportSubmission = {
      ...sub,
      values: finalValues,
      dynamicRows,
      updatedAt: new Date().toISOString(),
    };

    this.submissions.set(id, updated);
    return updated;
  }

  /**
   * Validates a submission using the ValidationEngine.
   */
  public validateSubmission(id: string): ValidationSummary {
    const sub = this.submissions.get(id);
    if (!sub) throw new Error(`Submission not found: ${id}`);

    const report = getReportByKey(sub.reportKey);
    if (!report) throw new Error(`Report definition not found: ${sub.reportKey}`);

    return ValidationEngine.validateReport(report, sub.values, sub.dynamicRows);
  }

  /**
   * Maker submits report to Checker.
   */
  public submitToChecker(id: string, user: UserSession, commentText?: string): ReportSubmission {
    const sub = this.submissions.get(id);
    if (!sub) throw new Error(`Submission not found: ${id}`);

    // Pre-submission validation gate
    const valSummary = this.validateSubmission(id);
    if (!valSummary.isValid) {
      throw new Error(`Validation failed with ${valSummary.errorsCount} errors. Fix all errors before submitting.`);
    }

    const { updatedSubmission } = WorkflowEngine.applyTransition(sub, 'PENDING_CHECKER', user, commentText);
    this.submissions.set(id, updatedSubmission);

    auditService.log({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'SUBMIT_TO_CHECKER',
      entityType: 'REPORT_SUBMISSION',
      entityId: id,
      correlationId: 'corr_' + id,
      details: `Submission submitted to Checker review by ${user.name}`,
    });

    return updatedSubmission;
  }

  /**
   * Checker reviews submission (Approve, Reject, Request Correction).
   */
  public reviewSubmission(
    id: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION',
    user: UserSession,
    commentText?: string
  ): ReportSubmission {
    const sub = this.submissions.get(id);
    if (!sub) throw new Error(`Submission not found: ${id}`);

    const targetStatus: SubmissionStatus =
      action === 'APPROVE'
        ? 'APPROVED'
        : action === 'REJECT'
        ? 'REJECTED'
        : 'CORRECTION_REQUIRED';

    const { updatedSubmission } = WorkflowEngine.applyTransition(sub, targetStatus, user, commentText);
    this.submissions.set(id, updatedSubmission);

    auditService.log({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: `CHECKER_${action}`,
      entityType: 'REPORT_SUBMISSION',
      entityId: id,
      correlationId: 'corr_' + id,
      details: `Checker ${user.name} set status to ${targetStatus}: ${commentText || 'No comment provided'}`,
    });

    return updatedSubmission;
  }

  /**
   * Delivers an approved submission to NBE via the NBEAdapter.
   */
  public async deliverToNBE(id: string, user: UserSession): Promise<DeliveryResult> {
    const sub = this.submissions.get(id);
    if (!sub) throw new Error(`Submission not found: ${id}`);

    if (sub.status !== 'APPROVED' && sub.status !== 'FAILED') {
      throw new Error(`Only APPROVED or FAILED submissions can be delivered to NBE. Current: ${sub.status}`);
    }

    // Set status to SENDING
    const { updatedSubmission: sendingSub } = WorkflowEngine.applyTransition(sub, 'SENDING', user, 'Initiating NBE Delivery');
    this.submissions.set(id, sendingSub);

    // Call adapter
    const result = await nbeAdapter.deliverReport(sendingSub);

    const finalStatus: SubmissionStatus = result.success ? 'SENT' : 'FAILED';
    const updatedSub: ReportSubmission = {
      ...sendingSub,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
      deliveryAttempts: [...sendingSub.deliveryAttempts, result.attempt],
      comments: [
        ...sendingSub.comments,
        {
          id: 'comm_' + Math.random().toString(36).substring(2, 9),
          userId: user.id,
          userName: user.name,
          userRole: user.role as any,
          comment: result.success
            ? `Successfully delivered to NBE. Receipt: ${result.response?.receiptNumber}`
            : `NBE delivery attempt failed: ${result.error}`,
          action: result.success ? 'APPROVE' : 'NOTE',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    this.submissions.set(id, updatedSub);
    return result;
  }
}

export const submissionService = new SubmissionServiceClass();
