# 14 - CHANGELOG

All notable changes and engineering enhancements for the Oromia Bank NBE Regulatory Reporting Platform are recorded in this file.

---

## [1.4.0-auditor-first-class-role] - 2026-09-29

### Added
- **First-Class Auditor Role & Regulatory Audit Workflow** (`.ai/19_AUDITOR_ROLE_AND_AUDIT_WORKFLOW.md`):
  - Implemented comprehensive `AuditorDashboard.tsx` with responsive multi-device design, zero-pill typography, and dark mode support.
  - Added dedicated Auditor registration workflow in `RegisterPage.tsx` capturing audit oversight scope and regulatory mandate justifications (BSD/03/2020).
  - Implemented Auditor approval workflow in `AdminDashboard.tsx` with administrative authorization and timestamping.
  - Implemented automatic redirection to `AUDITOR_DASHBOARD` upon auditor login in `LoginPage.tsx` and `userService.ts`.
  - Implemented **Audit Work Queue** with cross-departmental filtering (department, submission status, audit status, search query) and real-time finding aggregates.
  - Implemented **Deep Report Audit Inspection View** enabling line-by-line examination of submitted values, AST formulas, dynamic schedule tables, Maker/Checker signatures, and historical snapshots.
  - Implemented **Audit Findings Register** (`FIND-YYYYMMDD-XXXX`) tracking severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`), regulatory citations, financial variances, and lifecycle states (`OPEN`, `UNDER_REVIEW`, `REMEDIATION_PENDING`, `RESOLVED`, `CLOSED`).
  - Implemented **Evidence Management Repository** with Oromia Bank cryptographic tamper seals (`OB-EVID-SEAL-...`) and verification workflows.
  - Implemented **Confidential Auditor Work Papers & Notes** categorized by risk, compliance, data quality, and general observations.
  - Implemented **Remediation Action Tracking** with assigned department accountability, target completion dates, proof verification, and auditor sign-off.
  - Implemented **Formal Audit Reports Generator & Export** compiling executive memorandums, findings summaries, and official cryptographic verification seals.
  - Implemented dedicated backend REST API endpoints in `server.ts` under `/api/audit/*` for work queue, findings, evidence, notes, remediations, and report exports.
  - Implemented Django backend models, serializers, views, and migrations in `backend/apps/audit/` (`AuditFinding`, `AuditEvidence`, `AuditWorkingNote`, `RemediationAction`, `AuditReportPackage`).
  - Enforced strict segregation of duties (Abinet Alemu directive): In `backend/apps/permissions/authorization.py` and `backend/apps/workflows/workflow_engine.py`, the Auditor role is barred from drafting, editing, submitting, or approving reports (compliance oversight boundary).
  - Added automated test suite `src/tests/auditor-workflow.test.ts` integrated into `src/tests/run-all-tests.ts` (10 test sections, 100% pass).
  - Added Django unit test suite `backend/apps/audit/tests.py` (9 tests, 100% pass).
  - Standardized all 28 `.ai` documentation files with uniform `number_` prefixes (`01_` through `28_`) and cleaned up all duplicate files.

---

## [1.3.0-auditor-assessment] - 2026-09-28

### Added
- **Full Recovery Assessment for Auditor Role Implementation** (`.ai/19_AUDITOR_ROLE_AND_AUDIT_WORKFLOW.md`):
  - Completed thorough inspection across the entire project and all `.ai` documentation.
  - Formulated precise answers for all 10 recovery inquiries in `.ai/13_CURRENT_IMPLEMENTATION_STATUS.md`.
  - Clarified technical stack reality: both Express (`server.ts` port 3000), Django Core (`/backend` SQLite `db.sqlite3`), and Django NBE Simulator (`/nbe_simulator_service` SQLite `simulator_db.sqlite3` port 8001) are active and functional.
  - Cataloged gap analysis for first-class Auditor role: registration request, approval workflow, auditor dashboard, work queue, report audit view, revision history, evidence management, findings system (severity/status), audit notes, remediation tracking, formal audit reports, and Django boundary enforcement.

---

## [1.2.0-nbe-simulator] - 2026-09-28

### Added
- **Independent NBE Simulator Django Microservice** (`/nbe_simulator_service`):
  - Standalone Django project with own `manage.py`, settings, SQLite store (`simulator_db.sqlite3`), and dedicated port `8001`.
  - Models: `SimulatorScenario`, `SimulatorSubmission`, `SimulatorRequestLog`.
  - Full schema and envelope validation for all 24 NBE report definitions and institutional code `0000013`.
  - 6 runtime simulation modes: `ALWAYS_SUCCESS` (200/201 + cryptographic receipt `NBE-REC-YYYYMMDD-XXXX`), `VALIDATION_ERROR` (422), `AUTH_FAILURE` (401), `TIMEOUT` (504), `SERVER_ERROR` (500), `RANDOM_FLAKY`.
  - Deterministic test triggers: `X-Simulator-Force-Scenario` headers and query parameter overrides.
  - Idempotency deduplication: `Idempotency-Key` header prevents duplicate processing and returns existing receipts (`SUCCESS_IDEMPOTENT_DUPLICATE`).
  - Unit test suite (`nbe_simulator_service/apps/simulator/tests.py`): 11 tests covering all scenarios and 24 return definitions.
- **NBE Gateway & Adapter Integration**:
  - `backend/apps/nbe_gateway/gateway_service.py` and `src/services/nbeAdapter.ts`: Outbound HTTP client communicating with port 8001 with exponential retry backoff.
  - `server.ts`: Reverse-proxy endpoints for `/api/nbe-simulator/*` and auto-supervision of the Django simulator process.
  - Integration documentation in `.ai/18_NBE_SIMULATOR_MICROSERVICE.md`.

---

## [1.2.0-auth-seed-users] - 2026-09-28

### Removed
- **One-Click Role Login Visual Block**: Removed the testing shortcut button container (`ONE-CLICK ROLE LOGIN (TESTING)`) from `LoginPage.tsx`.
- **Underlying Shortcut/Bypass Logic**:
  - Removed `handleQuickPreset` and silent email default fallback in `LoginPage.tsx`.
  - Removed auto-provisioning bypass in `useBiometricAuth.ts` which previously generated fake simulated passkeys for unenrolled accounts.
  - Enforced strict password checks on `/api/auth/login` (missing password rejected with HTTP 400).
  - Removed all fake pre-seeded biometric credentials from initial user accounts in `userService.ts`.

### Added
- **Authoritative Development Seed Accounts**:
  - `admin@oromiabank.com` (Role: `ADMIN`, Dept: `Compliance & Legal Governance`, Password: `password`, Biometrics: `[]`).
  - `abebe.kebede@oromiabank.com` (Role: `MAKER`, Dept: `Credit Operations & Portfolio Management`, Password: `password`, Biometrics: `[]`).
  - `chala.desta@oromiabank.com` (Role: `CHECKER`, Dept: `Credit Operations & Portfolio Management`, Password: `password`, Biometrics: `[]`).
  - `auditor@oromiabank.com` (Role: `AUDITOR`, Dept: `Internal Audit & Regulatory Control`, Password: `password`, Biometrics: `[]`).
  - Additional users for Trade Services, Asset Recovery, and Pending Registration tests.
- **Seed Data Management & Reset Architecture**:
  - `userService.resetDevelopmentSeedData()` resets seed accounts cleanly.
  - `userService.getDevelopmentSeedSummary()` outputs developer reference data.
  - `POST /api/auth/seed-data/reset` server endpoint with non-repudiation audit logging.
  - `GET /api/auth/seed-data` server endpoint for configuration tooling.
- **Collapsible Development Test Reference UI**:
  - Added clean reference accordion on `LoginPage.tsx` displaying accounts and roles.
  - Provides "Use Email" filler (populates email only, preserving real password validation) and "Reset Seed Data" trigger.
