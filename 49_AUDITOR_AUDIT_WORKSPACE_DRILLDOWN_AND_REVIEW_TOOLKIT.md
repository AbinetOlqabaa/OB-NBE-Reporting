# Phase 49 — Auditor Audit Workspace Drilldown & Review Toolkit

## Purpose
Turn Auditor inspection into a structured evidence-based review workflow while preserving the existing deep report inspection, findings, evidence, notes, remediation and audit-report capabilities.

## 1. Audit Review workspace

Enhance the existing `REPORT_AUDIT` experience with a consistent inspection shell:

### Header
- Submission ID.
- Return/report key and reporting period.
- Department.
- Maker and Checker attribution.
- Current workflow status.
- Audit status.
- Integrity/seal indicator.
- Last authoritative update.

### Inspection sections
1. Executive return summary.
2. Maker/Checker workflow timeline.
3. Field-level values and validation status.
4. Dynamic schedules.
5. Formula/calculation results.
6. Historical snapshots and version comparison.
7. Correction/review comments.
8. Audit findings.
9. Evidence links.
10. Remediation history.

## 2. Comparison tools

Add controlled comparisons:
- Current submission vs previous approved version.
- Current submission vs previous reporting period.
- Current submission vs selected historical snapshot.
- Formula/calculated value vs submitted value.

Highlight differences without allowing Auditor editing.

## 3. Evidence-first review

Provide quick actions:
- Add evidence.
- Link existing evidence.
- Verify evidence seal.
- Open evidence metadata.
- Create finding from evidence.
- Add confidential working note.

Evidence must retain the existing SHA-256 tamper-seal model.

## 4. Findings integration

Auditor can:
- Create finding.
- Assign severity.
- Add regulatory reference.
- Add financial variance where applicable.
- Link evidence.
- Link affected submission.
- Track lifecycle status.

Do not introduce a second findings system.

## 5. Review outcome panel

Add a structured supervisory conclusion:
- No exception identified.
- Observation.
- Exception / finding raised.
- Requires remediation.
- Escalated for management attention.

The conclusion must be recorded in the audit trail and must not perform operational workflow approval.

## 6. Dense-data UX

Apply Phase 47 rules:
- Contained vertical scrolling for long inspection sections.
- Contained horizontal scrolling for wide regulatory tables.
- Maximize/full-view for dense tables, histories, evidence lists and payload-like data.
- No page-level horizontal scrolling.
- Escape and focus restoration for maximized views.
- Mobile safe-area handling.

## 7. Verification
Test:
- Historical comparison integrity.
- Snapshot immutability.
- Formula comparison.
- Evidence linking.
- Finding creation.
- Audit conclusion logging.
- Role restrictions.
- Keyboard navigation.
- Mobile/tablet/desktop viewports.
- Regression of existing audit modules.

## Completion gate
A reviewer should be able to open one submission and move from summary → workflow → values → history → evidence → finding/remediation without leaving the authorized Auditor workspace.
