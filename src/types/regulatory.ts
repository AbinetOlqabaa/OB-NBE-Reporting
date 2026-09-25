/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DataType = "NUMERIC" | "TEXT" | "DATE";

export type ReportingFrequency = "MONTHLY" | "QUARTERLY" | "ANNUAL";

export type SubmissionStatus =
  | "DRAFT"
  | "PENDING_CHECKER"
  | "CORRECTION_REQUIRED"
  | "REJECTED"
  | "APPROVED"
  | "SENDING"
  | "SENT"
  | "FAILED";

export interface ReportItemDefinition {
  Code: string;
  Value: string | number;
  _description: string;
  _dataType: DataType;
  _required: boolean;
  section?: string;
  category?: string;
  isTotal?: boolean;
}

export interface DynamicColumnDefinition {
  Code: string;
  Value: string | number;
  _description: string;
  _dataType: DataType;
  _required: boolean;
}

export interface DynamicAreaDefinition {
  Area: number;
  _areaName: string;
  DynamicItems: DynamicColumnDefinition[];
}

export interface FormulaDefinition {
  targetCode: string;
  expression: string;
  description: string;
  dependencies: string[];
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: "ERROR" | "WARNING";
  check: (values: Record<string, string | number>, dynamicRows?: Record<number, Record<string, any>[]>) => boolean;
}

export interface ReportMetadata {
  ReturnKey: string;
  Code: string; // short code e.g. POBEPE001, M_LCPLC001
  Title: string;
  Category: "Credit & Lending" | "Classification & Provisioning" | "Exposures & Concentration" | "Assets & Collateral" | "Restructuring" | "Sector Breakdown";
  Frequency: ReportingFrequency;
  InstCode: string;
  FinYear: number;
  StartDate: string;
  EndDate: string;
  Description: string;
  ReturnItemsList: ReportItemDefinition[];
  DynamicItemsList: DynamicAreaDefinition[];
  Formulas: FormulaDefinition[];
  ValidationRules: ValidationRule[];
  SourceFilename: string;
  SourceHash: string;
}

export interface ReportValueRecord {
  code: string;
  value: string | number;
  calculated?: boolean;
}

export interface DynamicRowRecord {
  id: string;
  areaId: number;
  values: Record<string, string | number>;
}

export interface ReportSubmission {
  id: string;
  reportKey: string;
  periodYear: number;
  periodStart: string;
  periodEnd: string;
  institutionCode: string;
  status: SubmissionStatus;
  version: number;
  values: Record<string, string | number>;
  dynamicRows: Record<number, DynamicRowRecord[]>;
  makerId: string;
  makerName: string;
  makerEmail: string;
  checkerId?: string;
  checkerName?: string;
  checkerEmail?: string;
  comments: SubmissionComment[];
  deliveryAttempts: DeliveryAttempt[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  idempotencyKey?: string;
}

export interface SubmissionComment {
  id: string;
  userId: string;
  userName: string;
  userRole: "MAKER" | "CHECKER" | "ADMIN";
  comment: string;
  action: "SUBMIT" | "APPROVE" | "REJECT" | "REQUEST_CORRECTION" | "SAVE_DRAFT" | "NOTE";
  timestamp: string;
}

export interface DeliveryAttempt {
  id: string;
  timestamp: string;
  endpointUrl: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT" | "REJECTED";
  statusCode: number;
  correlationId: string;
  idempotencyKey: string;
  requestPayload: any;
  responsePayload: any;
  error?: string;
  attemptNumber: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  correlationId: string;
  oldState?: any;
  newState?: any;
  details: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "MAKER" | "CHECKER" | "ADMIN" | "NBE_OFFICER";
  institutionCode: string;
  status?: "ACTIVE" | "PENDING_APPROVAL" | "DISABLED";
  department?: string;
  employeeId?: string;
}

export interface SimulationScenarioConfig {
  mode: "ALWAYS_SUCCESS" | "VALIDATION_FAILURE" | "AUTH_FAILURE" | "TIMEOUT" | "SERVER_ERROR" | "RANDOM_FLAKY";
  failureRatePercent: number;
  latencyMs: number;
}

export interface Phase2DataSource {
  id: string;
  name: string;
  type: "CORE_BANKING" | "ERP" | "TREASURY" | "LOAN_ORIGINATION";
  status: "CONNECTED" | "SYNCING" | "IDLE" | "ERROR";
  lastIngestionTime?: string;
  recordCount: number;
  qualityScore: number;
}
