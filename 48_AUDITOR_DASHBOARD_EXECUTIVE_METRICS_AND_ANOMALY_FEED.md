# Phase 48 — Auditor Dashboard Executive Metrics & Anomaly Detection Feed

## Purpose
Upgrade the existing Auditor Dashboard from a strong supervisory workspace into a faster internal-audit control center without weakening the existing RBAC, audit, SSOT, or responsive-layout architecture.

## Source baseline
The current Auditor Dashboard already contains:
- Audit Summary KPIs.
- Work Queue.
- Report Audit / deep statutory-return inspection.
- Findings register.
- Evidence repository.
- Confidential Working Notes.
- Remediation tracking.
- Formal Audit Reports / cryptographically sealed packages.

Phase 47 is the mandatory UI/UX contract for containment, responsive behavior, deliberate scrolling, accessibility, maximize/full-view behavior, and mobile/tablet/desktop verification.

## 1. New executive summary row

Add exactly four high-priority summary metric cards near the top of the Auditor Dashboard:

1. **Total Submissions**
   - Count of submissions visible to the Auditor's authorized supervisory scope.
   - Support date/range context.
   - Drill down to Work Queue.

2. **Pending Corrections**
   - Count of returns currently requiring Maker correction/resubmission.
   - Drill down to affected submissions and correction history.

3. **Approved Today**
   - Count of submissions reaching APPROVED during the current institutional business date.
   - Show comparison to prior business day only if authoritative historical data exists.

4. **Avg. Processing Time**
   - Average elapsed workflow time for the selected period.
   - Clearly define start/end events used by the metric.
   - Never mix draft preparation time with Checker review time unless the UI explicitly labels the measure.

### Card requirements
- Use existing OB design tokens.
- Minimum 44px interactive target where clickable.
- Do not use color alone to convey status.
- Loading, empty and error states are required.
- Cards must stack cleanly on mobile.
- Cards must remain inside the Phase 47 page-boundary contract.

## 2. Anomaly Detection Feed

Place an **Anomaly Detection Feed** below the existing primary charts/analytics and above lower-priority dashboard content.

### List item fields
Each anomaly should expose:
- Severity: CRITICAL / HIGH / MEDIUM / LOW / INFORMATIONAL.
- Submission/return identifier.
- Report type.
- Department.
- Detected timestamp.
- Short anomaly explanation.
- Evidence/rule reference.
- Current workflow status.
- Auditor action: Inspect / Open Audit / Add Finding.

### Initial anomaly rule families
Implement deterministic, explainable rules before any statistical/ML approach:
- Sudden value change versus prior approved submission.
- Unusual reversal/sign change.
- Unexpected zero or blank where prior periods contain material values.
- Ratio outside configured regulatory bounds.
- Repeated correction cycles.
- Submission timing materially outside normal reporting pattern.
- Duplicate/near-duplicate submission signature.
- Unexpected department/report combination.
- Material variance between calculated/formula result and reported value.
- NBE submission/rejection pattern requiring supervisory attention.

Every anomaly must identify the rule that produced it. Do not present an opaque score as a regulatory conclusion.

## 3. Feed behavior
- Default sort: severity, then newest.
- Filters: severity, department, report type, status, date.
- Search by submission ID/report key.
- Pagination or contained scrolling for long feeds.
- Maximize/full-view for dense feeds.
- Clicking an item opens the existing deep audit inspection view.
- "Create Finding" must use the existing findings service and preserve audit attribution.

## 4. Data and service design
Extend the existing Auditor service rather than creating a parallel audit store.

Recommended domain additions:
- `AuditAnomaly`
- `AnomalyRule`
- `AnomalyStatus`
- `AnomalyEvidenceLink`

Required fields should include rule ID, severity, detectedAt, submission ID, explanation, status, acknowledgedBy, acknowledgedAt, and evidence references.

## 5. Security / RBAC
- Auditor remains supervisory/read-only for regulatory returns.
- Anomaly acknowledgement or finding creation must not grant editing/approval powers.
- Server-side authorization is authoritative.
- Cross-department visibility must follow the existing effective-access model.
- Tampered submission IDs must not expose data.

## 6. Verification
Add automated tests for:
- Four metric calculations.
- Authorized-scope filtering.
- Date boundary handling.
- Each deterministic anomaly rule.
- Severity filtering.
- Drill-down navigation.
- Finding creation from an anomaly.
- No cross-department leakage.
- Loading/empty/error states.
- Responsive layout and contained scrolling.
- Maximize/restore and Escape.
- Regression of existing seven Auditor modules.

## Completion gate
Do not mark complete until all four cards and the anomaly feed are implemented, server-authorized, responsive, auditable, tested, and integrated with the existing Auditor Dashboard.
