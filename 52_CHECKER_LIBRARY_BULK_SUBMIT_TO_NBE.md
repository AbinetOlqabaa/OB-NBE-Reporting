# Phase 52 — Checker Library Bulk Submit to NBE

## Purpose
Add a controlled bulk final-submission workflow to the Checker Library for approved returns that are eligible for NBE transmission, while preserving 4-eyes governance and the existing NBE gateway/simulator architecture.

## 1. Eligibility

Only records that satisfy all authoritative conditions may be included:
- Checker is authorized for the submission.
- Required review/4-eyes decision is complete.
- Status is approved/eligible for NBE transmission.
- No unresolved blocking validation error.
- No unresolved workflow conflict.
- Submission remains immutable.
- NBE endpoint/report definition is active and valid.
- No duplicate final transmission is already recorded.

The UI must not infer eligibility from appearance alone.

## 2. UI

Add to Checker Library:
- Row selection checkboxes.
- Select All Visible.
- Eligible count.
- **Submit to NBE** bulk action.
- Clear Selection.

Ineligible records remain visible when useful but cannot be silently included.

## 3. Bulk comment

Provide a required/optional bulk transmission note according to final workflow policy.

The comment must:
- Be stored with the transmission batch/event.
- Be associated with every successful transmission.
- Never alter the regulatory return values.
- Preserve prior Checker comments.

## 4. Preview and confirmation

Use:
`Select → Eligibility Check → Preview → Bulk Comment → Confirm → Transmit → Results`

Preview must show:
- Selected count.
- Eligible count.
- Blocked count.
- Report keys.
- Reporting periods.
- NBE endpoint.
- Current status.
- Duplicate/idempotency warnings.

Confirmation must explicitly state that this is an NBE transmission action and that submitted records remain immutable.

## 5. NBE transmission architecture

Reuse the existing:
- NBE adapter/gateway.
- NBE Simulator only for authorized testing/admin contexts.
- Idempotency behavior.
- Retry/backoff behavior.
- Receipt/reference handling.
- Submission audit logging.

Do not implement a second NBE client.

## 6. Batch processing

Recommended behavior:
- Generate a unique batch ID.
- Process records independently but under a controlled batch.
- Maintain per-record idempotency keys.
- Record NBE receipt/reference for successful records.
- Record exact error category for failed records.
- Never resend successful records because another row failed.

## 7. Result report

Display:
- Total selected.
- Submitted successfully.
- Already transmitted/skipped.
- Validation blocked.
- Authorization blocked.
- NBE rejected.
- Transport failed.
- Retried.
- Receipt/reference numbers.

Provide a downloadable batch result report through Phase 50 export infrastructure.

## 8. Security
- Server-side role and submission authorization.
- Checker cannot transmit records outside effective scope.
- No client-side status override.
- No forged submission ID acceptance.
- No duplicate final submission.
- Preserve immutable historical snapshot and audit trail.
- Do not expose secrets or raw authentication data.

## 9. Phase 47 UX
- Contained scrolling for Library tables.
- Full-view for dense batch results.
- Mobile-friendly confirmation dialog.
- No page horizontal overflow.
- 44px touch targets.
- Accessible status messages.
- Keyboard/focus/Escape behavior.

## 10. Verification
Test:
- Mixed eligible/ineligible selection.
- Duplicate transmission.
- Idempotency.
- NBE success.
- NBE validation failure.
- NBE auth failure.
- NBE timeout.
- NBE server failure.
- Retry behavior.
- Partial success.
- Receipt persistence.
- Audit logging.
- Cross-department authorization.
- Mobile/tablet/desktop.
- Regression of single-record NBE transmission.

## Completion gate
A Checker can select multiple eligible approved returns, enter one bulk comment, review an exact transmission preview, confirm once, transmit safely, and receive auditable row-level NBE results.
