import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OpportunityAutomationRepository, OpportunityForAutomation } from 'src/modules/opportunities/domain/repositories/opportunity-automation.repository';
import { ReminderRepository } from 'src/modules/reminders/domain/repositories/reminder.repository';
import { CreateReminderInput, ReminderType } from 'src/modules/reminders/domain/types/reminder';
import { SellerNotificationService } from 'src/services/seller-notifications/seller-notification.service';

interface ReminderNotificationCandidate extends CreateReminderInput {
  seller: OpportunityForAutomation['seller'];
  opportunityCode: string;
}

const FOLLOW_UP_GRACE_DAYS = 3;
const FOLLOW_UP_DUE_WINDOW_DAYS = 1;
const PROPOSAL_EXPIRING_WINDOW_DAYS = 2;
const CUSTOMER_EVENT_WINDOW_DAYS = 7;

@Injectable()
export class FollowUpMonitorService {
  private readonly logger = new Logger(FollowUpMonitorService.name);

  constructor(
    private readonly opportunities: OpportunityAutomationRepository,
    private readonly reminders: ReminderRepository,
    private readonly notifications: SellerNotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'follow-up-monitor', timeZone: 'America/Sao_Paulo' })
  async handleDailySchedule(): Promise<void> {
    const created = await this.execute();
    this.logger.log(`Monitoramento de follow-up concluído: ${created} lembrete(s) criado(s).`);
  }

  async execute(now = new Date()): Promise<number> {
    const opportunities = await this.opportunities.findOpenForAutomation();
    const reminders = opportunities.flatMap((opportunity) => this.collectReminders(opportunity, now));
    const createdReminders = await this.reminders.createManyIfAbsent(reminders);
    const candidatesByKey = new Map(reminders.map((reminder) => [this.reminderKey(reminder), reminder]));

    await Promise.all(createdReminders.map(async (reminder) => {
      const candidate = candidatesByKey.get(this.reminderKey(reminder));
      if (!candidate) return;
      await this.notifications.sendFollowUpNotification({
        seller: candidate.seller,
        opportunityCode: candidate.opportunityCode,
        type: candidate.type,
        dueAt: candidate.dueAt,
      });
    }));
    return createdReminders.length;
  }

  private collectReminders(opportunity: OpportunityForAutomation, now: Date): ReminderNotificationCandidate[] {
    const reminders: ReminderNotificationCandidate[] = [];
    const today = this.startOfUtcDay(now);
    const followUpDueLimit = this.addDays(now, FOLLOW_UP_DUE_WINDOW_DAYS);
    const proposalExpiringLimit = this.addDays(today, PROPOSAL_EXPIRING_WINDOW_DAYS);
    const eventApproachingLimit = this.addDays(today, CUSTOMER_EVENT_WINDOW_DAYS);

    const nextFollowUpAt = opportunity.nextFollowUpAt;
    const hasCurrentNextFollowUp = nextFollowUpAt
      && (!opportunity.lastContactAt || nextFollowUpAt > opportunity.lastContactAt);

    if (hasCurrentNextFollowUp) {
      if (nextFollowUpAt <= now) {
        reminders.push(this.reminder(opportunity, ReminderType.FOLLOW_UP_OVERDUE, today));
      } else if (nextFollowUpAt <= followUpDueLimit) {
        reminders.push(this.reminder(opportunity, ReminderType.FOLLOW_UP_DUE, nextFollowUpAt));
      }
    } else if (opportunity.lastContactAt) {
      const dueAt = this.addDays(opportunity.lastContactAt, FOLLOW_UP_GRACE_DAYS);
      if (dueAt <= now) reminders.push(this.reminder(opportunity, ReminderType.FOLLOW_UP_OVERDUE, today));
    }

    if (opportunity.proposalValidUntil) {
      const validUntil = this.startOfUtcDay(opportunity.proposalValidUntil);
      if (validUntil < today) {
        reminders.push(this.reminder(opportunity, ReminderType.PROPOSAL_EXPIRED, validUntil));
      } else if (validUntil <= proposalExpiringLimit) {
        reminders.push(this.reminder(opportunity, ReminderType.PROPOSAL_EXPIRING, validUntil));
      }
    }

    if (opportunity.customerEventAt) {
      const eventAt = this.startOfUtcDay(opportunity.customerEventAt);
      if (eventAt >= today && eventAt <= eventApproachingLimit) {
        reminders.push(this.reminder(opportunity, ReminderType.CUSTOMER_EVENT_APPROACHING, eventAt));
      }
    }

    return reminders;
  }

  private reminder(opportunity: OpportunityForAutomation, type: ReminderType, dueAt: Date): ReminderNotificationCandidate {
    return {
      opportunityId: opportunity.id,
      type,
      dueAt,
      seller: opportunity.seller,
      opportunityCode: opportunity.code,
    };
  }

  private reminderKey(reminder: CreateReminderInput): string {
    return `${reminder.opportunityId}:${reminder.type}:${reminder.dueAt.toISOString()}`;
  }

  private startOfUtcDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}
