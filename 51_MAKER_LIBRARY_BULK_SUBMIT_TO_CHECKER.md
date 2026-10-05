# Phase 51 — Maker Library Bulk Submission to Checker

## Purpose
Add a safe, auditable bulk workflow to `MakerLibraryView` so Makers can select multiple eligible draft/returned submissions and submit them to Checker in one controlled operation.

## 1. Eligible records

Bulk action eligibility must be server-authoritative.

Default eligible states:
- `DRAFT`
- `IN_PROGRESS`
- `RETURNED` / `CORRECTION_REQUIRED` when resubmission rules permit.

Exclude:
- Already pending Checker review.
- Approved.
- Sent to NBE.
- Locked/conflicted records.
- Records outside the Maker's effective department/report scope.
- Records failing required validation gates.

## 2. UI

Add:
- Row checkbox.
- Select All Visible.
- Selected count.
- Bulk action ribbon.
- **Submit to Checker** button.
- Clear Selection.

Keep the existing single-record submission workflow intact.

### Bulk action modal

Step 1 — Selection summary
- Number of selected records.
- Report types.
- Reporting periods.
- Any ineligible records.

Step 2 — Validation preview
- Valid records.
- Blocked records.
- Validation errors.
- Concurrency conflicts.
- Missing required Checker assignment.

Step 3 — Bulk comment
- One shared comment/preparation note.
- Character limit and visible counter.
- Comment is copied to each successful submission only.
- Do not overwrite existing historical comments.

Step 4 — Checker assignment
- Reuse existing `CheckerSelector`.
- Support one or multiple eligible Checkers according to existing Phase 36 policy.
- Clearly indicate that assignment applies to all selected submissions.

Step 5 — Explicit confirmation
- Show final record count.
- Explain that submitted records become workflow-controlled and are no longer ordinary drafts.
- Confirm segregation-of-duties implications.

Step 6 — Result
- Submitted successfully.
- Blocked.
- Failed.
- Conflict.
- Notifications dispatched.

## 3. Transaction semantics

Do not make an unsafe all-or-nothing assumption.

Support:
- Atomic mode where explicitly appropriate.
- Partial-success mode with row-level outcomes.

Every row must have a deterministic result.

Optimistic locking must use each record's expected version.

## 4. Backend

Prefer a dedicated endpoint such as:
`POST /api/regulatory/submissions/bulk-submit-to-checker`

Request should include:
- submission IDs.
- expected versions.
- selected Checker IDs.
- primary Checker where required.
- shared comment.

Server must:
1. Re-authorize every record.
2. Revalidate workflow eligibility.
3. Revalidate validation state.
4. Validate Checker assignment.
5. Apply workflow transitions.
6. Persist the shared comment.
7. Create audit events.
8. Dispatch authoritative notifications.
9. Return row-level results.

## 5. Notifications

Reuse the existing server-generated notification service.

Do not create client-only notifications.

Where multiple submissions are sent to the same Checker, notifications may be grouped only if the existing notification UX can preserve every submission reference.

## 6. Phase 47 UX requirements
- Contained horizontal scrolling for wide Library tables.
- Contained vertical scrolling for long selection lists.
- Mobile-friendly bulk action ribbon.
- 44px minimum targets.
- Maximize/full-view for dense Library lists.
- No page-level horizontal overflow.
- Modal must remain usable in 320×568 and mobile landscape.
- Escape and focus restoration.

## 7. Verification
Test:
- Mixed eligible/ineligible selection.
- Cross-department selection.
- Forged IDs.
- Duplicate IDs.
- Optimistic concurrency conflicts.
- Validation blocking.
- Checker eligibility.
- Shared comment persistence.
- Partial success.
- Notification isolation.
- Audit trail.
- Mobile/tablet/desktop.
- Regression of single-record submission.

## Completion gate
A Maker can safely select multiple eligible Library records, preview exactly what will happen, add one bulk comment, choose authorized Checkers, confirm once, and receive a complete row-level outcome report.
