export interface OpportunityForEventDeadlinePolicy {
  customerEventAt: Date;
}

export class OpportunityEventDeadlinePolicy {
  static cutoffAt(
    opportunity: OpportunityForEventDeadlinePolicy,
    deliveryLeadDays = 0,
  ): Date {
    const cutoff = this.startOfUtcDay(opportunity.customerEventAt);
    cutoff.setUTCDate(cutoff.getUTCDate() - deliveryLeadDays);
    return cutoff;
  }

  static hasElapsed(
    opportunity: OpportunityForEventDeadlinePolicy,
    now = new Date(),
    deliveryLeadDays = 0,
  ): boolean {
    return this.cutoffAt(opportunity, deliveryLeadDays) < this.startOfUtcDay(now);
  }

  private static startOfUtcDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }
}
