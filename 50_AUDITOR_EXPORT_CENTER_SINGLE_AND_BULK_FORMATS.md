# Phase 50 — Auditor Export Center: Single & Bulk Regulatory/Audit Packages

## Purpose
Provide a dedicated Auditor export capability for single records and controlled bulk selections, using existing authorized export and cryptographically sealed audit-package architecture.

## 1. Export Center placement
Add an **Export** action to:
- Auditor Dashboard.
- Auditor Work Queue.
- Audit Report package view.
- Evidence/findings views where an export is meaningful.
- Library / Regulatory Repository where permitted.

Do not duplicate export logic in every page. Use one shared export service and one reusable export dialog.

## 2. Single-record exports

For one submission/audit case, support:

### CSV
Best for:
- Flat return values.
- Findings lists.
- Audit event extracts.
- Remediation action lists.

### XLSX
Best for:
- Regulatory return review.
- Multi-sheet supervisory workbooks.
- Findings/evidence/review sheets.
- Offline analysis.

Use the existing NBE-compliant XLSX approach where applicable.

### JSON
Best for:
- Structured submission/audit data.
- Machine-readable integration.
- Full metadata where authorized.

### PDF
Best for:
- Human-readable audit memorandum.
- Supervisory review pack.
- Findings and remediation summary.
- Printable sign-off package.

### Cryptographically sealed audit package
For formal audit reports, preserve the existing cryptographic/tamper-sealed package capability.

## 3. Bulk exports

Allow the Auditor to select multiple authorized submissions and export:

- CSV — flat consolidated extract.
- XLSX — workbook with separate sheets by logical domain.
- JSON — array/package structure.
- PDF — generated only when the selected volume is reasonable; otherwise offer a consolidated report package.
- ZIP — container for multiple generated artifacts when more than one format is requested.

## 4. Export selection workflow

Use:

`Select → Configure → Preview → Confirm → Generate → Download → Audit`

### Selection
- Row checkboxes.
- Select all visible.
- Select current filtered result set only when explicitly confirmed.
- Display selected count.

### Configure
- Format.
- Included sections.
- Date range.
- Include evidence metadata.
- Include findings.
- Include remediation.
- Include workflow history.
- Include validation summary.
- Optional redaction profile where required.

### Preview
Show:
- Record count.
- Estimated package size.
- Included sections.
- Excluded/unauthorized records.
- Validation warnings.

### Confirm
Require explicit confirmation for bulk generation and clearly state scope.

### Generate
- Background-friendly progress state for large packages.
- Do not block the whole page.
- Preserve selection and filters if generation fails.

### Download
Provide one clearly labeled result.
For multi-artifact requests, use ZIP.

### Audit
Record:
- Auditor.
- Timestamp.
- Selection criteria.
- Record IDs.
- Format(s).
- Redaction profile.
- Generation result.
- Package hash/seal where applicable.

## 5. Safety and security
- Server-side authorization on every export request.
- Never trust client-selected IDs.
- Re-check effective access at generation time.
- Prevent cross-department leakage.
- Preserve submitted-report immutability.
- Sanitize exported spreadsheet values against formula injection.
- Do not expose secrets, biometric data, passwords, or raw authentication tokens.
- Large export limits must be explicit and tested.

## 6. File naming

Use deterministic names, for example:
- `OB_AUDIT_<SubmissionId>_<Period>.pdf`
- `OB_AUDIT_<SubmissionId>_<Period>.xlsx`
- `OB_AUDIT_<SubmissionId>_<Period>.json`
- `OB_AUDIT_<Scope>_<Date>.csv`
- `OB_AUDIT_BULK_<DateTime>.zip`

Exact naming must follow the project's existing filename utilities where present.

## 7. Verification
Test:
- Single and bulk CSV.
- Single and bulk XLSX.
- Single and bulk JSON.
- PDF generation.
- ZIP packaging.
- Selection filtering.
- Unauthorized ID injection.
- Formula-injection sanitization.
- Export audit logging.
- Hash/seal verification.
- Large dataset pagination and export limits.
- Mobile export dialog scrolling and safe-area behavior.
- Phase 47 maximize/scroll rules.

## Completion gate
No export may bypass effective access, audit logging, immutable submission history, or the existing security architecture.
