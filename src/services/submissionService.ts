/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ReportSubmission,
  SubmissionStatus,
  UserSession,
  DynamicRowRecord,
} from '../types/regulatory.ts';
import { getReportByKey } from '../data/report-registry.ts';
import { getDepartmentForReport } from '../data/organizationHierarchy.ts';
import { WorkflowEngine } from './workflowEngine.ts';
import { FormulaEngine } from '../utils/formulaEngine.ts';
import { ValidationEngine } from '../utils/validationEngine.ts';
import type { ValidationSummary } from '../utils/validationEngine.ts';
import { nbeAdapter } from './nbeAdapter.ts';
import type { DeliveryResult } from './nbeAdapter.ts';
import { auditService } from './auditService.ts';
import { userService } from './userService.ts';

// Default Demo User Accounts with verified Oromia Bank departments
export const DEMO_USERS: UserSession[] = [
  {
    id: 'usr_maker_1',
    name: 'Abebe Kebede',
    email: 'abebe.kebede@oromiabank.com',
    role: 'MAKER',
    institutionCode: '0000013',
    department: 'Credit Operations & Portfolio Management',
    employeeId: 'OB-MKR-104',
    specialAccessGrants: [],
  },
  {
    id: 'usr_checker_1',
    name: 'Chala Desta',
    email: 'chala.desta@oromiabank.com',
    role: 'CHECKER',
    institutionCode: '0000013',
    department: 'Credit Operations & Portfolio Management',
    employeeId: 'OB-CHK-055',
    specialAccessGrants: [],
  },
  {
    id: 'usr_maker_2',
    name: 'Tigist Alemu',
    email: 'tigist.alemu@oromiabank.com',
    role: 'MAKER',
    institutionCode: '0000013',
    department: 'Trade Services & International Banking',
    employeeId: 'OB-MKR-219',
    specialAccessGrants: [
      {
        id: 'grant_demo_1',
        reportKey: 'DigitalLendingDL001',
        department: 'Digital Banking & Fintech Operations',
        grantedBy: 'Dawit Bekele (ADMIN)',
        grantedAt: '2026-03-01T10:00:00Z',
        reason: 'Temporary delegation for Fintech & Digital Trade micro-lending returns (Approved by VP Operations).',
      },
    ],
  },
  {
    id: 'usr_checker_2',
    name: 'Meron Worku',
    email: 'meron.worku@oromiabank.com',
    role: 'CHECKER',
    institutionCode: '0000013',
    department: 'Trade Services & International Banking',
    employeeId: 'OB-CHK-112',
    specialAccessGrants: [],
  },
  {
    id: 'usr_admin_1',
    name: 'Dawit Bekele',
    email: 'admin@oromiabank.com',
    role: 'ADMIN',
    institutionCode: '0000013',
    department: 'Compliance & Legal Governance',
    employeeId: 'OB-ADM-001',
  },
];

class SubmissionServiceClass {
  private submissions: Map<string, ReportSubmission> = new Map();

  constructor() {
    this.seedInitialSubmissions();
  }

  private seedInitialSubmissions(): void {
    // 1. POBEPE001 - In Review by Checker (Trade Services Department)
    const pobepe = getReportByKey('POBEPE001');
    if (pobepe) {
      const sub1: ReportSubmission = {
        id: 'sub_pobepe_001',
        reportKey: 'POBEPE001',
        department: 'Trade Services & International Banking',
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
        makerId: 'usr_maker_2',
        makerName: 'Tigist Alemu',
        makerEmail: 'tigist.alemu@oromiabank.com',
        makerDepartment: 'Trade Services & International Banking',
        comments: [
          {
            id: 'comm_init_1',
            userId: 'usr_maker_2',
            userName: 'Tigist Alemu',
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

    // 2. LOA_ADV_OUT_LA001 - APPROVED by Checker (Credit Operations & Portfolio Management)
    // Ready for the Maker to perform the final submission to NBE!
    const la001 = getReportByKey('LOA_ADV_OUT_LA001');
    if (la001) {
      const sub2: ReportSubmission = {
        id: 'sub_la001_approved',
        reportKey: 'LOA_ADV_OUT_LA001',
        department: 'Credit Operations & Portfolio Management',
        periodYear: 2026,
        periodStart: '2026-07-01T00:00:00',
        periodEnd: '2026-07-31T00:00:00',
        institutionCode: '0000013',
        status: 'APPROVED',
        version: 1,
        values: {
          '001_00001': 14500000000,
          '001_00002': 2100000000,
          '001_00003': 1850000000,
          '001_00004': 14750000000,
          '001_00005': 1200000000,
          '001_00006': 13550000000,
        },
        dynamicRows: {},
        makerId: 'usr_maker_1',
        makerName: 'Abebe Kebede',
        makerEmail: 'abebe.kebede@oromiabank.com',
        makerDepartment: 'Credit Operations & Portfolio Management',
        checkerId: 'usr_checker_1',
        checkerName: 'Chala Desta',
        checkerEmail: 'chala.desta@oromiabank.com',
        checkerDepartment: 'Credit Operations & Portfolio Management',
        comments: [
          {
            id: 'comm_la_1',
            userId: 'usr_maker_1',
            userName: 'Abebe Kebede',
            userRole: 'MAKER',
            comment: 'July 2026 disbursement and collection reconciliation finalized.',
            action: 'SUBMIT',
            timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
          },
          {
            id: 'comm_la_2',
            userId: 'usr_checker_1',
            userName: 'Chala Desta',
            userRole: 'CHECKER',
            comment: '4-Eyes verification complete. Reconciled with core banking ledger. Approved for final Maker NBE delivery.',
            action: 'APPROVE',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
        ],
        deliveryAttempts: [],
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        reviewedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        approvedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      };
      this.submissions.set(sub2.id, sub2);
    }

    // 3. DigitalLendingDL001 - Draft by Tigist Alemu under Admin Special Access Grant
    const dl001 = getReportByKey('DigitalLendingDL001');
    if (dl001) {
      const sub3: ReportSubmission = {
        id: 'sub_dl001_special',
        reportKey: 'DigitalLendingDL001',
        department: 'Digital Banking & Fintech Operations',
        periodYear: 2026,
        periodStart: '2026-04-01T00:00:00',
        periodEnd: '2026-06-30T00:00:00',
        institutionCode: '0000013',
        status: 'DRAFT',
        version: 1,
        values: {
          'DL001_01': 45000,
          'DL001_02': 185000000,
          'DL001_03': 165000000,
          'DL001_04': 20000000,
          'DL001_05': 1.8,
        },
        dynamicRows: {},
        makerId: 'usr_maker_2',
        makerName: 'Tigist Alemu',
        makerEmail: 'tigist.alemu@oromiabank.com',
        makerDepartment: 'Trade Services & International Banking', // Home dept
        comments: [
          {
            id: 'comm_dl_1',
            userId: 'usr_maker_2',
            userName: 'Tigist Alemu',
            userRole: 'MAKER',
            comment: 'Draft created under Special Access authorization granted by Compliance Admin.',
            action: 'SAVE_DRAFT',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        deliveryAttempts: [],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
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

  public getByFilter(filter: {
    status?: SubmissionStatus;
    reportKey?: string;
    makerId?: string;
    department?: string;
  }): ReportSubmission[] {
    return this.getAll().filter((s) => {
      if (filter.status && s.status !== filter.status) return false;
      if (filter.reportKey && s.reportKey !== filter.reportKey) return false;
      if (filter.makerId && s.makerId !== filter.makerId) return false;
      if (
        filter.department &&
        s.department &&
        s.department.toLowerCase() !== filter.department.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }

  /**
   * Creates a new submission draft for a specific report key.
   * Enforces:
   * 1. Only MAKERS can create submission drafts. (Checkers and Admins cannot create!).
   * 2. Maker must be assigned to the department that owns this report,
   *    OR have been granted special access by the Administrator.
   */
  public createSubmission(reportKey: string, user: UserSession): ReportSubmission {
    if (user.role !== 'MAKER') {
      throw new Error(
        `Role violation: Only registered Makers can create report drafts. Current role: ${user.role}`
      );
    }

    const report = getReportByKey(reportKey);
    if (!report) {
      throw new Error(`Report template not found for key: ${reportKey}`);
    }

    const reportDept = report.department || getDepartmentForReport(report.ReturnKey);

    // Verify Maker department / special access authorization
    const isAuthorized = userService.canMakerAccessReport(user, report.ReturnKey);
    if (!isAuthorized) {
      throw new Error(
        `Department restriction: Your department (${user.department || 'Unassigned'}) is not authorized to prepare return "${report.Title}" (${report.ReturnKey}). This return belongs to "${reportDept}". Contact Administrator for Special Cross-Department Access.`
      );
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
      department: reportDept,
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
      makerDepartment: user.department,
      comments: [
        {
          id: 'comm_' + Math.random().toString(36).substring(2, 9),
          userId: user.id,
          userName: user.name,
          userRole: user.role as any,
          comment: `Report draft initiated for ${report.Title} [${reportDept}]`,
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
      details: `Created new draft for report ${report.ReturnKey} in department ${reportDept}`,
    });

    return submission;
  }

  /**
   * Updates an existing draft's field values and dynamic rows.
   * Enforces: Checkers and Admins CANNOT modify report draft data!
   */
  public updateDraft(
    id: string,
    values: Record<string, string | number>,
    dynamicRows: Record<number, DynamicRowRecord[]>,
    user: UserSession
  ): ReportSubmission {
    if (user.role !== 'MAKER') {
      throw new Error(
        `Role violation: Only authorized Makers can edit report draft data. User role "${user.role}" is restricted from data modifications.`
      );
    }

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
    if (user.role !== 'MAKER') {
      throw new Error('Only the Maker who prepared the report can submit it to the Checker.');
    }

    const sub = this.submissions.get(id);
    if (!sub) throw new Error(`Submission not found: ${id}`);

    // Pre-submission validation gate
    const valSummary = this.validateSubmission(id);
    if (!valSummary.isValid) {
      throw new Error(
        `Validation failed with ${valSummary.errorsCount} errors. Please correct all validation issues before submitting to Checker.`
      );
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
      details: `Submission submitted for 4-eyes review by Maker ${user.name} (${user.department})`,
    });

    return updatedSubmission;
  }

  /**
   * Checker reviews submission (Approve, Reject, Request Correction).
   * Enforces:
   * 1. Only CHECKERS can review. (Makers cannot approve; Admins are read-only).
   * 2. Checker must be from the same department, OR have Admin-granted special access.
   */
  public reviewSubmission(
    id: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION',
    user: UserSession,
    commentText?: string
  ): ReportSubmission {
    const sub = this.submissions.get(id);
    if (!sub) throw new Error(`Submission not found: ${id}`);

    // Department & Segregation Verification
    const checkAuth = userService.canCheckerReviewSubmission(user, sub);
    if (!checkAuth.allowed) {
      throw new Error(`Review denied: ${checkAuth.reason}`);
    }

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
      details: `Checker ${user.name} (${user.department}) reviewed submission with decision: ${targetStatus}. Notes: ${commentText || 'N/A'}`,
    });

    return updatedSubmission;
  }

  /**
   * Maker delivers an approved submission to NBE via the NBEAdapter.
   * Requirement: "It's the Maker who makes the final submission of the report to the NBE."
   */
  public async deliverToNBE(id: string, user: UserSession): Promise<DeliveryResult> {
    if (user.role !== 'MAKER') {
      throw new Error(
        `Segregation of duties rule: It is the Maker who makes the final submission of the report to the NBE. Current user role: ${user.role}`
      );
    }

    const sub = this.submissions.get(id);
    if (!sub) throw new Error(`Submission not found: ${id}`);

    if (sub.status !== 'APPROVED' && sub.status !== 'FAILED') {
      throw new Error(`Only APPROVED or FAILED submissions can be delivered to NBE. Current: ${sub.status}`);
    }

    // Set status to SENDING
    const { updatedSubmission: sendingSub } = WorkflowEngine.applyTransition(
      sub,
      'SENDING',
      user,
      'Maker initiated final transmission to National Bank of Ethiopia'
    );
    this.submissions.set(id, sendingSub);

    auditService.log({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'DELIVER_TO_NBE_START',
      entityType: 'REPORT_SUBMISSION',
      entityId: id,
      correlationId: 'corr_' + id,
      details: `Maker ${user.name} initiated transmission to NBE Portal`,
    });

    // Call adapter
    const result = await nbeAdapter.deliverReport(sendingSub);

    const finalStatus: SubmissionStatus = result.success ? 'SENT' : 'FAILED';
    const updatedSub: ReportSubmission = {
      ...sendingSub,
      status: finalStatus,
      nbeReferenceNumber: result.response?.receiptNumber || sendingSub.nbeReferenceNumber,
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
            ? `Transmission to NBE confirmed. Submission Receipt Number: ${result.response?.receiptNumber || result.response?.submissionReceiptNumber}`
            : `NBE Gateway rejected delivery: ${result.error}`,
          action: result.success ? 'APPROVE' : 'NOTE',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    this.submissions.set(id, updatedSub);

    auditService.log({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: result.success ? 'DELIVER_TO_NBE_SUCCESS' : 'DELIVER_TO_NBE_FAILURE',
      entityType: 'REPORT_SUBMISSION',
      entityId: id,
      correlationId: 'corr_' + id,
      details: result.success
        ? `NBE delivery confirmed with receipt ${result.response?.receiptNumber}`
        : `NBE delivery failed: ${result.error}`,
    });

    return result;
  }

  public deleteSubmission(id: string, user: UserSession): boolean {
    const sub = this.submissions.get(id);
    if (!sub) return false;

    if (sub.status !== 'DRAFT' && sub.status !== 'CORRECTION_REQUIRED' && sub.status !== 'FAILED' && user.role !== 'ADMIN') {
      throw new Error(`Cannot delete submission in ${sub.status} state. Only drafts can be deleted.`);
    }

    this.submissions.delete(id);
    auditService.log({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'DELETE_DRAFT',
      entityType: 'REPORT_SUBMISSION',
      entityId: id,
      correlationId: 'corr_' + id,
      details: `${user.role} ${user.name} deleted draft ${sub.reportKey}`,
    });
    return true;
  }
}

export const submissionService = new SubmissionServiceClass();
