/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimulationScenarioConfig } from '../types/regulatory';

export interface ReceivedReportRecord {
  id: string;
  receivedAt: string;
  returnKey: string;
  institutionCode: string;
  finYear: number;
  periodStart: string;
  periodEnd: string;
  payload: any;
  headers: Record<string, string>;
  idempotencyKey: string;
  correlationId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'DUPLICATE';
  validationErrors?: string[];
  submissionReceiptNumber: string;
}

export interface SimulatorApiLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  idempotencyKey?: string;
  correlationId?: string;
  message: string;
  durationMs: number;
}

class NBESimulatorService {
  private scenario: SimulationScenarioConfig = {
    mode: 'ALWAYS_SUCCESS',
    failureRatePercent: 0,
    latencyMs: 150,
  };

  private receivedSubmissions: ReceivedReportRecord[] = [];
  private apiLogs: SimulatorApiLog[] = [];
  private knownIdempotencyKeys: Set<string> = new Set();

  public getScenario(): SimulationScenarioConfig {
    return { ...this.scenario };
  }

  public setScenario(newScenario: Partial<SimulationScenarioConfig>): SimulationScenarioConfig {
    this.scenario = { ...this.scenario, ...newScenario };
    return { ...this.scenario };
  }

  public getSubmissions(): ReceivedReportRecord[] {
    return [...this.receivedSubmissions];
  }

  public getLogs(): SimulatorApiLog[] {
    return [...this.apiLogs];
  }

  public clearLogs(): void {
    this.apiLogs = [];
  }

  /**
   * Evaluates incoming regulatory report submission against active simulator configuration.
   */
  public async processSubmission(
    payload: any,
    headers: Record<string, string>
  ): Promise<{ statusCode: number; body: any }> {
    const startTime = Date.now();
    const idempotencyKey = headers['idempotency-key'] || headers['x-idempotency-key'] || 'NONE';
    const correlationId = headers['x-correlation-id'] || 'corr_' + Math.random().toString(36).substring(2, 9);

    // Apply configured latency
    if (this.scenario.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.scenario.latencyMs));
    }

    // 1. Scenario: Timeout Simulation
    if (this.scenario.mode === 'TIMEOUT') {
      const logEntry: SimulatorApiLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        method: 'POST',
        path: '/api/v1/nbe-simulator/submit',
        statusCode: 504,
        idempotencyKey,
        correlationId,
        message: 'Simulated Gateway Timeout (504): NBE Central Gateway did not respond within deadline',
        durationMs: Date.now() - startTime,
      };
      this.apiLogs.unshift(logEntry);
      return {
        statusCode: 504,
        body: { error: 'Gateway Timeout', message: 'NBE Portal Gateway Timeout', correlationId },
      };
    }

    // 2. Scenario: Auth Failure
    if (this.scenario.mode === 'AUTH_FAILURE') {
      const logEntry: SimulatorApiLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        method: 'POST',
        path: '/api/v1/nbe-simulator/submit',
        statusCode: 401,
        idempotencyKey,
        correlationId,
        message: 'Simulated Authentication Failure: Invalid or expired mTLS client certificate / bearer token',
        durationMs: Date.now() - startTime,
      };
      this.apiLogs.unshift(logEntry);
      return {
        statusCode: 401,
        body: { error: 'Unauthorized', message: 'Invalid or missing NBE Client Authorization', correlationId },
      };
    }

    // 3. Scenario: Internal Server Error 500
    if (this.scenario.mode === 'SERVER_ERROR') {
      const logEntry: SimulatorApiLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        method: 'POST',
        path: '/api/v1/nbe-simulator/submit',
        statusCode: 500,
        idempotencyKey,
        correlationId,
        message: 'Simulated NBE Central Server Error (500): Internal Database connection failure',
        durationMs: Date.now() - startTime,
      };
      this.apiLogs.unshift(logEntry);
      return {
        statusCode: 500,
        body: { error: 'Internal Server Error', message: 'NBE Data Ingestion Gateway temporary outage', correlationId },
      };
    }

    // 4. Duplicate Check (Idempotency)
    if (idempotencyKey !== 'NONE' && this.knownIdempotencyKeys.has(idempotencyKey)) {
      const existing = this.receivedSubmissions.find((s) => s.idempotencyKey === idempotencyKey);
      const logEntry: SimulatorApiLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        method: 'POST',
        path: '/api/v1/nbe-simulator/submit',
        statusCode: 200,
        idempotencyKey,
        correlationId,
        message: `Idempotent duplicate request safely detected and acknowledged with existing receipt ${existing?.submissionReceiptNumber}`,
        durationMs: Date.now() - startTime,
      };
      this.apiLogs.unshift(logEntry);
      return {
        statusCode: 200,
        body: {
          status: 'SUCCESS_IDEMPOTENT_DUPLICATE',
          message: 'Report payload was previously received and confirmed.',
          receiptNumber: existing?.submissionReceiptNumber || 'REC-EXISTING',
          correlationId,
        },
      };
    }

    // 5. Schema Validation in Simulator
    const validationErrors: string[] = [];
    if (!payload?.ReturnKey) validationErrors.push('Missing ReturnKey identifier');
    if (!payload?.InstCode) validationErrors.push('Missing InstCode institutional code');
    if (payload?.InstCode !== '0000013') validationErrors.push(`Unrecognized institution code: ${payload?.InstCode}`);
    if (!Array.isArray(payload?.ReturnItemsList)) validationErrors.push('ReturnItemsList must be an array');

    if (this.scenario.mode === 'VALIDATION_FAILURE' || validationErrors.length > 0) {
      if (validationErrors.length === 0) {
        validationErrors.push('Simulated regulatory schema discrepancy: Net loan volume variance detected against NBE prudential standards.');
      }

      const logEntry: SimulatorApiLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        method: 'POST',
        path: '/api/v1/nbe-simulator/submit',
        statusCode: 422,
        idempotencyKey,
        correlationId,
        message: `Regulatory schema validation rejected: ${validationErrors.join('; ')}`,
        durationMs: Date.now() - startTime,
      };
      this.apiLogs.unshift(logEntry);

      return {
        statusCode: 422,
        body: {
          error: 'Unprocessable Entity',
          message: 'Regulatory report validation rejected by NBE intake engine',
          validationErrors,
          correlationId,
        },
      };
    }

    // 6. Success Reception
    const receiptNum = 'NBE-REC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    if (idempotencyKey !== 'NONE') {
      this.knownIdempotencyKeys.add(idempotencyKey);
    }

    const record: ReceivedReportRecord = {
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      receivedAt: new Date().toISOString(),
      returnKey: payload.ReturnKey,
      institutionCode: payload.InstCode,
      finYear: payload.FinYear || 2026,
      periodStart: payload.StartDate,
      periodEnd: payload.EndDate,
      payload,
      headers,
      idempotencyKey,
      correlationId,
      status: 'ACCEPTED',
      submissionReceiptNumber: receiptNum,
    };

    this.receivedSubmissions.unshift(record);

    const logEntry: SimulatorApiLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      method: 'POST',
      path: '/api/v1/nbe-simulator/submit',
      statusCode: 200,
      idempotencyKey,
      correlationId,
      message: `Report ${payload.ReturnKey} successfully ingested. Assigned official receipt ${receiptNum}`,
      durationMs: Date.now() - startTime,
    };
    this.apiLogs.unshift(logEntry);

    return {
      statusCode: 200,
      body: {
        status: 'ACCEPTED',
        message: 'Regulatory report successfully verified and accepted into NBE repository.',
        receiptNumber: receiptNum,
        timestamp: record.receivedAt,
        correlationId,
      },
    };
  }
}

export const nbeSimulator = new NBESimulatorService();
