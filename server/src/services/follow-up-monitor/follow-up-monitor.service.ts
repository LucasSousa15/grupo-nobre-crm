import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { env } from 'src/core/config/env';
import { OperationalMetricsService } from 'src/core/observability/operational-metrics.service';
import { CloseExpiredOpportunityUseCase } from 'src/modules/opportunities/application/use-cases/close-expired-opportunity.use-case';
import { OpportunityAutomationRepository, OpportunityForAutomation } from 'src/modules/opportunities/domain/repositories/opportunity-automation.repository';
import { FollowUpReminderPolicy } from 'src/modules/opportunities/domain/services/follow-up-reminder-policy.service';
import { ReminderRepository } from 'src/modules/reminders/domain/repositories/reminder.repository';
import { CreateReminderInput } from 'src/modules/reminders/domain/types/reminder';
import { SellerNotificationService } from 'src/services/seller-notifications/seller-notification.service';

interface ReminderNotificationCandidate extends CreateReminderInput {
  seller: OpportunityForAutomation['seller'];
  opportunityCode: string;
  customerEventAt: Date;
}

@Injectable()
export class FollowUpMonitorService {
  private readonly logger = new Logger(FollowUpMonitorService.name);
  private readonly eventDeliveryLeadDays = env.eventDeliveryLeadDays;

  constructor(
    private readonly opportunities: OpportunityAutomationRepository,
    private readonly reminders: ReminderRepository,
    private readonly notifications: SellerNotificationService,
    private readonly closeExpiredOpportunity: CloseExpiredOpportunityUseCase,
    private readonly metrics: OperationalMetricsService = new OperationalMetricsService(),
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'follow-up-monitor', timeZone: 'America/Sao_Paulo' })
  async handleDailySchedule(): Promise<void> {
    const startedAt = Date.now();
    try {
      const created = await this.execute();
      this.metrics.recordFollowUpMonitor(true, Date.now() - startedAt);
      this.logger.log(`Monitoramento concluÃ­do: ${created} lembrete(s) criado(s).`);
    } catch (error) {
      this.metrics.recordFollowUpMonitor(false, Date.now() - startedAt);
      this.logger.error('Monitoramento falhou.', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async execute(now = new Date()): Promise<number> {
    const opportunities = await this.opportunities.findOpenForAutomation();
    const automaticallyLostIds = new Set(
      (await Promise.all(opportunities.map(async (opportunity) =>
        (await this.closeExpiredOpportunity.execute(opportunity.id, now)) ? opportunity.id : null,
      ))).filter((id): id is string => id !== null),
    );
    const candidates = opportunities
      .filter((opportunity) => !automaticallyLostIds.has(opportunity.id))
      .flatMap((opportunity): ReminderNotificationCandidate[] =>
        FollowUpReminderPolicy.collect(opportunity, now, this.eventDeliveryLeadDays).map((reminder) => ({
          ...reminder,
          seller: opportunity.seller,
          opportunityCode: opportunity.code,
          customerEventAt: opportunity.customerEventAt,
        })),
      );
    const reminders = candidates.map(({ seller: _seller, opportunityCode: _opportunityCode, customerEventAt: _customerEventAt, ...reminder }) => reminder);
    const createdReminders = await this.reminders.createManyIfAbsent(reminders);
    const candidatesByKey = new Map(candidates.map((candidate) => [this.reminderKey(candidate), candidate]));

    await Promise.all(createdReminders.map(async (reminder) => {
      const candidate = candidatesByKey.get(this.reminderKey(reminder));
      if (!candidate) return;
      await this.notifications.sendFollowUpNotification({
        seller: candidate.seller,
        opportunityCode: candidate.opportunityCode,
        type: candidate.type,
        dueAt: candidate.dueAt,
        customerEventAt: candidate.customerEventAt,
      });
    }));
    return createdReminders.length;
  }

  private reminderKey(reminder: CreateReminderInput): string {
    return `${reminder.opportunityId}:${reminder.type}:${reminder.dueAt.toISOString()}`;
  }
}
