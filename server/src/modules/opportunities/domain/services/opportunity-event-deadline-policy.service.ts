export interface OpportunityForEventDeadlinePolicy {
  customerEventAt: Date;
}

export class OpportunityEventDeadlinePolicy {
  static hasElapsed(
    opportunity: OpportunityForEventDeadlinePolicy,
    now = new Date(),
  ): boolean {
    return (
      this.startOfUtcDay(opportunity.customerEventAt) < this.startOfUtcDay(now)
    );
  }

  private static startOfUtcDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }
}
