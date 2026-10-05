/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { submissionService } from './submissionService.ts';
import { getAllReports } from '../data/report-registry.ts';
import { getDepartmentForReport } from '../data/organizationHierarchy.ts';
import type { ReportSubmission, SubmissionStatus } from '../types/regulatory.ts';
import { BrowserSafeEventEmitter } from '../utils/browserEventEmitter.ts';

export interface DailyTrendPoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Oct 01"
  created: number;
  submitted: number;
  approved: number;
  transmitted: number;
  corrections: number;
  avgTurnaroundHours: number;
}

export interface DepartmentPerformance {
  department: string;
  shortCode?: string;
  totalSubmissions: number;
  approvedCount: number;
  pendingCount: number;
  correctionCount: number;
  transmittedCount: number;
  avgTurnaroundHours: number;
  complianceRate: number; // percentage on-time / within SLA
  firstPassRate: number; // percentage approved without correction
  shareOfTotal: number; // percentage of total bank returns
}

export interface StatusDistributionItem {
  name: string;
  status: SubmissionStatus | string;
  count: number;
  percentage: number;
  color: string;
}

export interface ApprovalTimeBucket {
  rangeLabel: string; // e.g. "< 2 hrs", "2-6 hrs", "6-12 hrs", "12-24 hrs", "> 24 hrs"
  count: number;
  percentage: number;
}

export interface FrequencyVolumeItem {
  frequency: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalyticsSummaryKPIs {
  totalSubmissions30d: number;
  activeInFlight: number;
  pendingCheckerCount: number;
  needsCorrectionCount: number;
  approvedCount: number;
  transmittedCount: number;
  avgTurnaroundHours: number;
  medianTurnaroundHours: number;
  slaComplianceRate: number; // % completed within 24h statutory target
  firstPassRate: number; // % approved without rejection/correction
  nbeTransmissionRate: number; // % approved returns successfully delivered to NBE
  totalDepartmentsReporting: number;
  fastestApprovalHours: number;
  longestApprovalHours: number;
  growthVsPriorPeriod: number; // % change vs previous 30 days
}

export interface AnalyticsFilter {
  timeRangeDays: number; // 7, 14, 30, 90
  department: string; // 'ALL' or specific department name
  frequency: string; // 'ALL' or 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
}

export interface ReportingAnalyticsData {
  kpis: AnalyticsSummaryKPIs;
  dailyTrends: DailyTrendPoint[];
  departmentPerformance: DepartmentPerformance[];
  statusDistribution: StatusDistributionItem[];
  approvalBuckets: ApprovalTimeBucket[];
  frequencyDistribution: FrequencyVolumeItem[];
  recentAuditedSubmissions: {
    id: string;
    reportKey: string;
    reportTitle: string;
    department: string;
    makerName: string;
    checkerName: string;
    status: SubmissionStatus;
    submittedAt: string;
    reviewedAt: string;
    turnaroundHours: number;
    withinSla: boolean;
    nbeReceipt?: string;
  }[];
}

class ReportingAnalyticsServiceClass {
  public readonly events = new BrowserSafeEventEmitter();
  private readonly SLA_TARGET_HOURS = 24.0; // Standard 24h internal 4-eyes turnaround SLA

  constructor() {
    submissionService.onSubmissionsUpdated(() => {
      this.events.emit('analyticsUpdated');
    });
    submissionService.onSubmissionChange(() => {
      this.events.emit('analyticsUpdated');
    });
  }

  public subscribe(callback: () => void): () => void {
    this.events.on('analyticsUpdated', callback);
    return () => this.events.off('analyticsUpdated', callback);
  }

  /**
   * Calculates comprehensive reporting performance analytics based on filters
   */
  public getAnalytics(filter: Partial<AnalyticsFilter> = {}): ReportingAnalyticsData {
    const timeRangeDays = filter.timeRangeDays || 30;
    const departmentFilter = filter.department || 'ALL';
    const frequencyFilter = (filter.frequency || 'ALL').toUpperCase();

    const allSubmissions = submissionService.getAll();
    const allTemplates = getAllReports();
    const templateMap = new Map(allTemplates.map((t) => [t.ReturnKey, t]));

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);
    const priorCutoffTime = new Date(now.getTime() - timeRangeDays * 2 * 24 * 60 * 60 * 1000);

    // Filter submissions matching criteria
    const filteredSubs = allSubmissions.filter((sub) => {
      const subDept = sub.department || getDepartmentForReport(sub.reportKey);
      if (departmentFilter !== 'ALL' && subDept.toLowerCase() !== departmentFilter.toLowerCase()) {
        return false;
      }

      if (frequencyFilter !== 'ALL') {
        const tpl = templateMap.get(sub.reportKey);
        const subFreq = (tpl?.Frequency || 'MONTHLY').toUpperCase();
        if (subFreq !== frequencyFilter) {
          return false;
        }
      }

      const createdTime = new Date(sub.createdAt || sub.updatedAt);
      return createdTime >= cutoffTime;
    });

    // Submissions in the prior comparison window (for growth comparison)
    const priorPeriodSubs = allSubmissions.filter((sub) => {
      const createdTime = new Date(sub.createdAt || sub.updatedAt);
      return createdTime >= priorCutoffTime && createdTime < cutoffTime;
    });

    // 1. Compute KPIs
    const kpis = this.computeKPIs(filteredSubs, priorPeriodSubs.length);

    // 2. Compute Daily Volume Trends
    const dailyTrends = this.computeDailyTrends(filteredSubs, timeRangeDays);

    // 3. Compute Department Performance
    const departmentPerformance = this.computeDepartmentPerformance(filteredSubs);

    // 4. Compute Status Distribution
    const statusDistribution = this.computeStatusDistribution(filteredSubs);

    // 5. Compute Approval Time Buckets
    const approvalBuckets = this.computeApprovalBuckets(filteredSubs);

    // 6. Compute Frequency Volume Breakdown
    const frequencyDistribution = this.computeFrequencyDistribution(filteredSubs, templateMap);

    // 7. Recent Audited Submissions with Turnaround metrics
    const recentAuditedSubmissions = this.computeRecentAudited(filteredSubs, templateMap);

    return {
      kpis,
      dailyTrends,
      departmentPerformance,
      statusDistribution,
      approvalBuckets,
      frequencyDistribution,
      recentAuditedSubmissions,
    };
  }

  private computeKPIs(subs: ReportSubmission[], priorCount: number): AnalyticsSummaryKPIs {
    const total = subs.length;
    let pendingCount = 0;
    let correctionCount = 0;
    let approvedCount = 0;
    let transmittedCount = 0;

    const turnaroundTimes: number[] = [];
    let withinSlaCount = 0;
    let firstPassCount = 0;
    let reviewedCount = 0;
    const deptsSet = new Set<string>();

    for (const sub of subs) {
      const dept = sub.department || getDepartmentForReport(sub.reportKey);
      if (dept) deptsSet.add(dept);

      if (sub.status === 'PENDING_CHECKER') pendingCount++;
      else if (sub.status === 'CORRECTION_REQUIRED') correctionCount++;
      else if (sub.status === 'APPROVED') approvedCount++;
      else if (sub.status === 'SENT' || sub.nbeReferenceNumber) {
        approvedCount++;
        transmittedCount++;
      }

      // Turnaround calculation: submittedAt -> reviewedAt or approvedAt
      if (sub.submittedAt && (sub.reviewedAt || sub.approvedAt)) {
        const start = new Date(sub.submittedAt).getTime();
        const end = new Date(sub.reviewedAt || sub.approvedAt!).getTime();
        if (end >= start) {
          const hours = (end - start) / (1000 * 60 * 60);
          turnaroundTimes.push(hours);
          reviewedCount++;

          if (hours <= this.SLA_TARGET_HOURS) {
            withinSlaCount++;
          }

          // First-pass check: Was it approved directly without going to CORRECTION_REQUIRED?
          const hadCorrection = (sub.comments || []).some(
            (c) => c.action === 'REQUEST_CORRECTION' || c.action === 'REJECT'
          );
          if (!hadCorrection && (sub.status === 'APPROVED' || sub.status === 'SENT')) {
            firstPassCount++;
          }
        }
      }
    }

    const activeInFlight = pendingCount + correctionCount;
    let avgTurnaround = 0;
    let medianTurnaround = 0;
    let fastestTurnaround = 0;
    let longestTurnaround = 0;

    if (turnaroundTimes.length > 0) {
      const sum = turnaroundTimes.reduce((acc, val) => acc + val, 0);
      avgTurnaround = Number((sum / turnaroundTimes.length).toFixed(1));

      const sorted = [...turnaroundTimes].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianTurnaround = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      medianTurnaround = Number(medianTurnaround.toFixed(1));
      fastestTurnaround = Number(sorted[0].toFixed(1));
      longestTurnaround = Number(sorted[sorted.length - 1].toFixed(1));
    }

    const slaComplianceRate =
      reviewedCount > 0 ? Number(((withinSlaCount / reviewedCount) * 100).toFixed(1)) : 100.0;
    const firstPassRate =
      reviewedCount > 0 ? Number(((firstPassCount / reviewedCount) * 100).toFixed(1)) : 100.0;
    const nbeTransmissionRate =
      approvedCount > 0 ? Number(((transmittedCount / approvedCount) * 100).toFixed(1)) : 100.0;

    // Growth calculation vs prior period
    const growthVsPriorPeriod =
      priorCount > 0 ? Number((((total - priorCount) / priorCount) * 100).toFixed(1)) : 0;

    return {
      totalSubmissions30d: total,
      activeInFlight,
      pendingCheckerCount: pendingCount,
      needsCorrectionCount: correctionCount,
      approvedCount,
      transmittedCount,
      avgTurnaroundHours: avgTurnaround,
      medianTurnaroundHours: medianTurnaround,
      slaComplianceRate,
      firstPassRate,
      nbeTransmissionRate,
      totalDepartmentsReporting: deptsSet.size,
      fastestApprovalHours: fastestTurnaround,
      longestApprovalHours: longestTurnaround,
      growthVsPriorPeriod,
    };
  }

  private computeDailyTrends(subs: ReportSubmission[], daysCount: number): DailyTrendPoint[] {
    const result: DailyTrendPoint[] = [];
    const now = new Date();

    // Initialize daily slots for the last `daysCount` days in chronological order
    const dateMap = new Map<
      string,
      {
        created: number;
        submitted: number;
        approved: number;
        transmitted: number;
        corrections: number;
        turnaroundHoursList: number[];
      }
    >();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, {
        created: 0,
        submitted: 0,
        approved: 0,
        transmitted: 0,
        corrections: 0,
        turnaroundHoursList: [],
      });
    }

    // Populate from actual submissions
    for (const sub of subs) {
      const createdKey = (sub.createdAt || sub.updatedAt).split('T')[0];
      if (dateMap.has(createdKey)) {
        dateMap.get(createdKey)!.created++;
      }

      if (sub.submittedAt) {
        const subKey = sub.submittedAt.split('T')[0];
        if (dateMap.has(subKey)) {
          dateMap.get(subKey)!.submitted++;
        }
      }

      if (sub.approvedAt || (sub.reviewedAt && (sub.status === 'APPROVED' || sub.status === 'SENT'))) {
        const appKey = (sub.approvedAt || sub.reviewedAt!).split('T')[0];
        if (dateMap.has(appKey)) {
          dateMap.get(appKey)!.approved++;
        }
      }

      if (sub.finalSubmittedAt || (sub.status === 'SENT' && sub.nbeReferenceNumber)) {
        const transKey = (sub.finalSubmittedAt || sub.approvedAt || sub.updatedAt).split('T')[0];
        if (dateMap.has(transKey)) {
          dateMap.get(transKey)!.transmitted++;
        }
      }

      if (sub.status === 'CORRECTION_REQUIRED') {
        const corrKey = (sub.reviewedAt || sub.updatedAt).split('T')[0];
        if (dateMap.has(corrKey)) {
          dateMap.get(corrKey)!.corrections++;
        }
      }

      // Turnaround time list per day
      if (sub.submittedAt && (sub.reviewedAt || sub.approvedAt)) {
        const dateKey = (sub.approvedAt || sub.reviewedAt!).split('T')[0];
        if (dateMap.has(dateKey)) {
          const diffHours =
            (new Date(sub.approvedAt || sub.reviewedAt!).getTime() - new Date(sub.submittedAt).getTime()) /
            (1000 * 60 * 60);
          if (diffHours >= 0) {
            dateMap.get(dateKey)!.turnaroundHoursList.push(diffHours);
          }
        }
      }
    }

    for (const [dateStr, counts] of dateMap.entries()) {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      let avgTurnaround = 0;
      if (counts.turnaroundHoursList.length > 0) {
        const sum = counts.turnaroundHoursList.reduce((acc, v) => acc + v, 0);
        avgTurnaround = Number((sum / counts.turnaroundHoursList.length).toFixed(1));
      }

      result.push({
        date: dateStr,
        dayLabel,
        created: counts.created,
        submitted: counts.submitted,
        approved: counts.approved,
        transmitted: counts.transmitted,
        corrections: counts.corrections,
        avgTurnaroundHours: avgTurnaround,
      });
    }

    return result;
  }

  private computeDepartmentPerformance(subs: ReportSubmission[]): DepartmentPerformance[] {
    const deptMap = new Map<
      string,
      {
        total: number;
        approved: number;
        pending: number;
        correction: number;
        transmitted: number;
        turnarounds: number[];
        withinSla: number;
        firstPass: number;
      }
    >();

    for (const sub of subs) {
      const dept = sub.department || getDepartmentForReport(sub.reportKey) || 'Operations & Treasury';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          total: 0,
          approved: 0,
          pending: 0,
          correction: 0,
          transmitted: 0,
          turnarounds: [],
          withinSla: 0,
          firstPass: 0,
        });
      }

      const d = deptMap.get(dept)!;
      d.total++;

      if (sub.status === 'PENDING_CHECKER') d.pending++;
      else if (sub.status === 'CORRECTION_REQUIRED') d.correction++;
      else if (sub.status === 'APPROVED') d.approved++;
      else if (sub.status === 'SENT' || sub.nbeReferenceNumber) {
        d.approved++;
        d.transmitted++;
      }

      if (sub.submittedAt && (sub.reviewedAt || sub.approvedAt)) {
        const diff =
          (new Date(sub.reviewedAt || sub.approvedAt!).getTime() - new Date(sub.submittedAt).getTime()) /
          (1000 * 60 * 60);
        if (diff >= 0) {
          d.turnarounds.push(diff);
          if (diff <= this.SLA_TARGET_HOURS) d.withinSla++;

          const hadCorr = (sub.comments || []).some(
            (c) => c.action === 'REQUEST_CORRECTION' || c.action === 'REJECT'
          );
          if (!hadCorr && (sub.status === 'APPROVED' || sub.status === 'SENT')) {
            d.firstPass++;
          }
        }
      }
    }

    const totalBankSubs = subs.length || 1;
    const result: DepartmentPerformance[] = [];

    for (const [department, data] of deptMap.entries()) {
      let avgTurnaround = 0;
      if (data.turnarounds.length > 0) {
        const sum = data.turnarounds.reduce((acc, v) => acc + v, 0);
        avgTurnaround = Number((sum / data.turnarounds.length).toFixed(1));
      }

      const totalReviewed = data.turnarounds.length;
      const complianceRate =
        totalReviewed > 0 ? Number(((data.withinSla / totalReviewed) * 100).toFixed(1)) : 100.0;
      const firstPassRate =
        totalReviewed > 0 ? Number(((data.firstPass / totalReviewed) * 100).toFixed(1)) : 100.0;
      const shareOfTotal = Number(((data.total / totalBankSubs) * 100).toFixed(1));

      // Derive short code
      const words = department.split(' ').filter((w) => w !== '&' && w !== 'and');
      const shortCode = words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);

      result.push({
        department,
        shortCode,
        totalSubmissions: data.total,
        approvedCount: data.approved,
        pendingCount: data.pending,
        correctionCount: data.correction,
        transmittedCount: data.transmitted,
        avgTurnaroundHours: avgTurnaround,
        complianceRate,
        firstPassRate,
        shareOfTotal,
      });
    }

    // Sort by total submissions descending
    return result.sort((a, b) => b.totalSubmissions - a.totalSubmissions);
  }

  private computeStatusDistribution(subs: ReportSubmission[]): StatusDistributionItem[] {
    const total = subs.length || 1;
    const counts: Record<string, number> = {
      APPROVED: 0,
      SENT: 0,
      PENDING_CHECKER: 0,
      CORRECTION_REQUIRED: 0,
      DRAFT: 0,
      REJECTED: 0,
      ARCHIVED: 0,
    };

    for (const sub of subs) {
      if (sub.status === 'SENT' || sub.nbeReferenceNumber) {
        counts.SENT++;
      } else if (sub.status === 'APPROVED') {
        counts.APPROVED++;
      } else if (sub.status === 'PENDING_CHECKER') {
        counts.PENDING_CHECKER++;
      } else if (sub.status === 'CORRECTION_REQUIRED') {
        counts.CORRECTION_REQUIRED++;
      } else if (sub.status === 'REJECTED') {
        counts.REJECTED++;
      } else if (sub.status === 'ARCHIVED' || sub.status === 'VOIDED') {
        counts.ARCHIVED++;
      } else {
        counts.DRAFT++;
      }
    }

    const items: StatusDistributionItem[] = [
      {
        name: 'Delivered to NBE',
        status: 'SENT',
        count: counts.SENT,
        percentage: Number(((counts.SENT / total) * 100).toFixed(1)),
        color: '#4338ca', // ob-indigo-700
      },
      {
        name: 'Approved by Checker',
        status: 'APPROVED',
        count: counts.APPROVED,
        percentage: Number(((counts.APPROVED / total) * 100).toFixed(1)),
        color: '#059669', // emerald-600
      },
      {
        name: 'Pending Checker',
        status: 'PENDING_CHECKER',
        count: counts.PENDING_CHECKER,
        percentage: Number(((counts.PENDING_CHECKER / total) * 100).toFixed(1)),
        color: '#d97706', // amber-600
      },
      {
        name: 'Correction Required',
        status: 'CORRECTION_REQUIRED',
        count: counts.CORRECTION_REQUIRED,
        percentage: Number(((counts.CORRECTION_REQUIRED / total) * 100).toFixed(1)),
        color: '#dc2626', // rose-600
      },
      {
        name: 'Maker Draft',
        status: 'DRAFT',
        count: counts.DRAFT,
        percentage: Number(((counts.DRAFT / total) * 100).toFixed(1)),
        color: '#64748b', // slate-500
      },
      {
        name: 'Rejected',
        status: 'REJECTED',
        count: counts.REJECTED,
        percentage: Number(((counts.REJECTED / total) * 100).toFixed(1)),
        color: '#be123c', // rose-700
      },
      {
        name: 'Archived / Voided',
        status: 'ARCHIVED',
        count: counts.ARCHIVED,
        percentage: Number(((counts.ARCHIVED / total) * 100).toFixed(1)),
        color: '#94a3b8', // slate-400
      },
    ];

    const filtered = items.filter((item) => item.count > 0);
    if (filtered.length > 0) {
      const sum = filtered.reduce((acc, i) => acc + i.percentage, 0);
      if (Math.abs(sum - 100) > 0.01) {
        filtered[0].percentage = Number((filtered[0].percentage + (100 - sum)).toFixed(1));
      }
      return filtered;
    }
    return items.slice(0, 5);
  }

  private computeApprovalBuckets(subs: ReportSubmission[]): ApprovalTimeBucket[] {
    const buckets: Record<string, number> = {
      '< 2 hrs': 0,
      '2 - 6 hrs': 0,
      '6 - 12 hrs': 0,
      '12 - 24 hrs': 0,
      '> 24 hrs (Over SLA)': 0,
    };

    let totalReviewed = 0;

    for (const sub of subs) {
      if (sub.submittedAt && (sub.reviewedAt || sub.approvedAt)) {
        const diff =
          (new Date(sub.reviewedAt || sub.approvedAt!).getTime() - new Date(sub.submittedAt).getTime()) /
          (1000 * 60 * 60);
        if (diff >= 0) {
          totalReviewed++;
          if (diff < 2) buckets['< 2 hrs']++;
          else if (diff <= 6) buckets['2 - 6 hrs']++;
          else if (diff <= 12) buckets['6 - 12 hrs']++;
          else if (diff <= 24) buckets['12 - 24 hrs']++;
          else buckets['> 24 hrs (Over SLA)']++;
        }
      }
    }

    const divisor = totalReviewed || 1;
    return Object.entries(buckets).map(([rangeLabel, count]) => ({
      rangeLabel,
      count,
      percentage: Number(((count / divisor) * 100).toFixed(1)),
    }));
  }

  private computeFrequencyDistribution(
    subs: ReportSubmission[],
    templateMap: Map<string, any>
  ): FrequencyVolumeItem[] {
    const counts: Record<string, number> = {
      DAILY: 0,
      WEEKLY: 0,
      MONTHLY: 0,
      QUARTERLY: 0,
    };

    for (const sub of subs) {
      const tpl = templateMap.get(sub.reportKey);
      const freq = (tpl?.Frequency || 'MONTHLY').toUpperCase();
      if (counts[freq] !== undefined) {
        counts[freq]++;
      } else {
        counts.MONTHLY++;
      }
    }

    const total = subs.length || 1;
    const colors: Record<string, string> = {
      DAILY: '#0284c7', // sky-600
      WEEKLY: '#6366f1', // indigo-500
      MONTHLY: '#059669', // emerald-600
      QUARTERLY: '#7c3aed', // violet-600
    };

    return Object.entries(counts).map(([frequency, count]) => ({
      frequency,
      count,
      percentage: Number(((count / total) * 100).toFixed(1)),
      color: colors[frequency] || '#64748b',
    }));
  }

  private computeRecentAudited(subs: ReportSubmission[], templateMap: Map<string, any>) {
    return subs
      .filter((s) => s.submittedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8)
      .map((sub) => {
        const tpl = templateMap.get(sub.reportKey);
        let turnaroundHours = 0;
        let withinSla = true;

        if (sub.submittedAt && (sub.reviewedAt || sub.approvedAt)) {
          turnaroundHours = Number(
            (
              (new Date(sub.reviewedAt || sub.approvedAt!).getTime() - new Date(sub.submittedAt).getTime()) /
              (1000 * 60 * 60)
            ).toFixed(1)
          );
          withinSla = turnaroundHours <= this.SLA_TARGET_HOURS;
        }

        return {
          id: sub.id,
          reportKey: sub.reportKey,
          reportTitle: tpl?.Title || sub.reportKey,
          department: sub.department || getDepartmentForReport(sub.reportKey),
          makerName: sub.makerName,
          checkerName: sub.checkerName || 'Pending Assignment',
          status: sub.status,
          submittedAt: sub.submittedAt || sub.createdAt,
          reviewedAt: sub.reviewedAt || sub.approvedAt || 'In Review',
          turnaroundHours,
          withinSla,
          nbeReceipt: sub.nbeReferenceNumber,
        };
      });
  }

  /**
   * Generates a structured CSV report for compliance export
   */
  public generateCsvExport(data: ReportingAnalyticsData): string {
    const lines: string[] = [];
    lines.push('OROMIA BANK S.C. - NATIONAL BANK OF ETHIOPIA (NBE) REGULATORY REPORTING PERFORMANCE ANALYTICS');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Statutory Dual-Control Turnaround SLA: ${this.SLA_TARGET_HOURS} Hours`);
    lines.push('');

    // KPIs
    lines.push('--- EXECUTIVE SUMMARY METRICS (30-DAY WINDOW) ---');
    lines.push('Metric,Value');
    lines.push(`Total Submissions Processed,${data.kpis.totalSubmissions30d}`);
    lines.push(`Active In-Flight Pipeline,${data.kpis.activeInFlight}`);
    lines.push(`Average Checker Turnaround (Hours),${data.kpis.avgTurnaroundHours} hrs`);
    lines.push(`Median Checker Turnaround (Hours),${data.kpis.medianTurnaroundHours} hrs`);
    lines.push(`SLA Compliance Rate (<=24h),${data.kpis.slaComplianceRate}%`);
    lines.push(`First-Pass Acceptance Rate,${data.kpis.firstPassRate}%`);
    lines.push(`NBE Direct Transmission Rate,${data.kpis.nbeTransmissionRate}%`);
    lines.push(`Reporting Bank Departments,${data.kpis.totalDepartmentsReporting}`);
    lines.push('');

    // Department Performance
    lines.push('--- DEPARTMENT PERFORMANCE & COMPLIANCE ---');
    lines.push('Department,Total Returns,Approved,Pending,Needs Correction,Delivered to NBE,Avg Turnaround (hrs),SLA Compliance Rate,First Pass Rate,Share of Bank Total');
    for (const d of data.departmentPerformance) {
      lines.push(
        `"${d.department}",${d.totalSubmissions},${d.approvedCount},${d.pendingCount},${d.correctionCount},${d.transmittedCount},${d.avgTurnaroundHours},${d.complianceRate}%,${d.firstPassRate}%,${d.shareOfTotal}%`
      );
    }
    lines.push('');

    // Daily Volume
    lines.push('--- 30-DAY DAILY VOLUME & TURNAROUND TREND ---');
    lines.push('Date,Day,Created,Submitted to Checker,Approved,Delivered to NBE,Corrections,Avg Turnaround (hrs)');
    for (const t of data.dailyTrends) {
      lines.push(`${t.date},"${t.dayLabel}",${t.created},${t.submitted},${t.approved},${t.transmitted},${t.corrections},${t.avgTurnaroundHours}`);
    }

    return lines.join('\n');
  }
}

export const reportingAnalyticsService = new ReportingAnalyticsServiceClass();
