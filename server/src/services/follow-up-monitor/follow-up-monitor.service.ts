import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OpportunityAutomationRepository, OpportunityForAutomation } from 'src/modules/opportunities/domain/repositories/opportunity-automation.repository';
import { ReminderRepository } from 'src/modules/reminders/domain/repositories/reminder.repository';
import { CreateReminderInput, ReminderType } from 'src/modules/reminders/domain/types/reminder';

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
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'follow-up-monitor', timeZone: 'America/Sao_Paulo' })
  async handleDailySchedule(): Promise<void> {
    const created = await this.execute();
    this.logger.log(`Monitoramento de follow-up concluído: ${created} lembrete(s) criado(s).`);
  }

  async execute(now = new Date()): Promise<number> {
    const opportunities = await this.opportunities.findOpenForAutomation();
    const reminders = opportunities.flatMap((opportunity) => this.collectReminders(opportunity, now));
    return this.reminders.createManyIfAbsent(reminders);
  }

  private collectReminders(opportunity: OpportunityForAutomation, now: Date): CreateReminderInput[] {
    const reminders: CreateReminderInput[] = [];
    const today = this.startOfUtcDay(now);
    const followUpDueLimit = this.addDays(now, FOLLOW_UP_DUE_WINDOW_DAYS);
    const proposalExpiringLimit = this.addDays(today, PROPOSAL_EXPIRING_WINDOW_DAYS);
    const eventApproachingLimit = this.addDays(today, CUSTOMER_EVENT_WINDOW_DAYS);

    if (opportunity.nextFollowUpAt) {
      if (opportunity.nextFollowUpAt <= now) {
        reminders.push(this.reminder(opportunity.id, ReminderType.FOLLOW_UP_OVERDUE, opportunity.nextFollowUpAt));
      } else if (opportunity.nextFollowUpAt <= followUpDueLimit) {
        reminders.push(this.reminder(opportunity.id, ReminderType.FOLLOW_UP_DUE, opportunity.nextFollowUpAt));
      }
    } else if (opportunity.lastContactAt) {
      const dueAt = this.addDays(opportunity.lastContactAt, FOLLOW_UP_GRACE_DAYS);
      if (dueAt <= now) reminders.push(this.reminder(opportunity.id, ReminderType.FOLLOW_UP_OVERDUE, dueAt));
    }

    if (opportunity.proposalValidUntil) {
      const validUntil = this.startOfUtcDay(opportunity.proposalValidUntil);
      if (validUntil < today) {
        reminders.push(this.reminder(opportunity.id, ReminderType.PROPOSAL_EXPIRED, validUntil));
      } else if (validUntil <= proposalExpiringLimit) {
        reminders.push(this.reminder(opportunity.id, ReminderType.PROPOSAL_EXPIRING, validUntil));
      }
    }

    if (opportunity.customerEventAt) {
      const eventAt = this.startOfUtcDay(opportunity.customerEventAt);
      if (eventAt >= today && eventAt <= eventApproachingLimit) {
        reminders.push(this.reminder(opportunity.id, ReminderType.CUSTOMER_EVENT_APPROACHING, eventAt));
      }
    }

    return reminders;
  }

  private reminder(opportunityId: string, type: ReminderType, dueAt: Date): CreateReminderInput {
    return { opportunityId, type, dueAt };
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
