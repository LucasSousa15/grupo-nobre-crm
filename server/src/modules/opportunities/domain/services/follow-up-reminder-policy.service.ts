import {
  CreateReminderInput,
  ReminderType,
} from "src/modules/reminders/domain/types/reminder";
import { OpportunityEventDeadlinePolicy } from "./opportunity-event-deadline-policy.service";

export interface OpportunityForFollowUpPolicy {
  id: string;
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
  proposalValidUntil: Date | null;
  customerEventAt: Date;
}

export const FOLLOW_UP_GRACE_DAYS = 3;
export const FOLLOW_UP_DUE_WINDOW_DAYS = 1;
export const PROPOSAL_EXPIRING_WINDOW_DAYS = 2;
export const CUSTOMER_EVENT_WINDOW_DAYS = 7;

export class FollowUpReminderPolicy {
  static collect(
    opportunity: OpportunityForFollowUpPolicy,
    now = new Date(),
    eventDeliveryLeadDays = 0,
  ): CreateReminderInput[] {
    const reminders: CreateReminderInput[] = [];
    const today = this.startOfUtcDay(now);
    const followUpDueLimit = this.addDays(now, FOLLOW_UP_DUE_WINDOW_DAYS);
    const proposalExpiringLimit = this.addDays(
      today,
      PROPOSAL_EXPIRING_WINDOW_DAYS,
    );
    const deliveryCutoffApproachingLimit = this.addDays(
      today,
      CUSTOMER_EVENT_WINDOW_DAYS,
    );
    const nextFollowUpAt = opportunity.nextFollowUpAt;
    const hasCurrentNextFollowUp =
      nextFollowUpAt &&
      (!opportunity.lastContactAt ||
        nextFollowUpAt > opportunity.lastContactAt);

    if (hasCurrentNextFollowUp) {
      if (nextFollowUpAt <= now) {
        reminders.push(
          this.reminder(opportunity.id, ReminderType.FOLLOW_UP_OVERDUE, today),
        );
      } else if (nextFollowUpAt <= followUpDueLimit) {
        reminders.push(
          this.reminder(
            opportunity.id,
            ReminderType.FOLLOW_UP_DUE,
            nextFollowUpAt,
          ),
        );
      }
    } else if (opportunity.lastContactAt) {
      const dueAt = this.addDays(
        opportunity.lastContactAt,
        FOLLOW_UP_GRACE_DAYS,
      );
      if (dueAt <= now)
        reminders.push(
          this.reminder(opportunity.id, ReminderType.FOLLOW_UP_OVERDUE, today),
        );
    }

    if (opportunity.proposalValidUntil) {
      const validUntil = this.startOfUtcDay(opportunity.proposalValidUntil);
      if (validUntil < today) {
        reminders.push(
          this.reminder(
            opportunity.id,
            ReminderType.PROPOSAL_EXPIRED,
            validUntil,
          ),
        );
      } else if (validUntil <= proposalExpiringLimit) {
        reminders.push(
          this.reminder(
            opportunity.id,
            ReminderType.PROPOSAL_EXPIRING,
            validUntil,
          ),
        );
      }
    }

    const deliveryCutoffAt = OpportunityEventDeadlinePolicy.cutoffAt(
      opportunity,
      eventDeliveryLeadDays,
    );
    if (deliveryCutoffAt >= today && deliveryCutoffAt <= deliveryCutoffApproachingLimit) {
      // `dueAt` representa o dia do lembrete para permitir uma notificação por dia
      // na janela crítica. A data real do evento segue como contexto da notificação.
      reminders.push(
        this.reminder(
          opportunity.id,
          ReminderType.CUSTOMER_EVENT_APPROACHING,
          today,
        ),
      );
    }

    return reminders;
  }

  private static reminder(
    opportunityId: string,
    type: ReminderType,
    dueAt: Date,
  ): CreateReminderInput {
    return { opportunityId, type, dueAt };
  }

  private static startOfUtcDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}
