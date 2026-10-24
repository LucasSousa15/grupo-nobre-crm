import { Injectable } from '@nestjs/common';

@Injectable()
export class OperationalMetricsService {
  private requests = 0;
  private requestErrors = 0;
  private unexpectedErrors = 0;
  private totalRequestDurationMs = 0;
  private followUpMonitorRuns = 0;
  private followUpMonitorFailures = 0;
  private lastFollowUpMonitorDurationMs: number | null = null;

  recordRequest(statusCode: number, durationMs: number): void {
    this.requests += 1;
    this.totalRequestDurationMs += durationMs;
    if (statusCode >= 500) this.requestErrors += 1;
  }

  recordUnexpectedError(): void { this.unexpectedErrors += 1; }

  recordFollowUpMonitor(success: boolean, durationMs: number): void {
    this.followUpMonitorRuns += 1;
    this.lastFollowUpMonitorDurationMs = durationMs;
    if (!success) this.followUpMonitorFailures += 1;
  }

  snapshot() {
    return {
      requests: this.requests,
      requestErrors: this.requestErrors,
      unexpectedErrors: this.unexpectedErrors,
      averageRequestDurationMs: this.requests === 0 ? 0 : Math.round(this.totalRequestDurationMs / this.requests),
      followUpMonitorRuns: this.followUpMonitorRuns,
      followUpMonitorFailures: this.followUpMonitorFailures,
      lastFollowUpMonitorDurationMs: this.lastFollowUpMonitorDurationMs,
    };
  }
}
