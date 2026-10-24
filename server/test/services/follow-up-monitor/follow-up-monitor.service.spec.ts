import { describe, expect, it } from 'vitest';
import { OpportunityAutomationRepository, OpportunityForAutomation } from 'src/modules/opportunities/domain/repositories/opportunity-automation.repository';
import { ReminderRepository } from 'src/modules/reminders/domain/repositories/reminder.repository';
import { CreateReminderInput, ReminderType } from 'src/modules/reminders/domain/types/reminder';
import { FollowUpMonitorService } from 'src/services/follow-up-monitor/follow-up-monitor.service';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';

class InMemoryOpportunityAutomationRepository implements OpportunityAutomationRepository {
  constructor(readonly opportunities: OpportunityForAutomation[]) {}
  async findOpenForAutomation(): Promise<OpportunityForAutomation[]> { return this.opportunities; }
}

class InMemoryReminderRepository implements ReminderRepository {
  readonly reminders: CreateReminderInput[] = [];

  async createManyIfAbsent(reminders: CreateReminderInput[]): Promise<number> {
    const missing = reminders.filter((reminder) => !this.reminders.some((current) => (
      current.opportunityId === reminder.opportunityId
      && current.type === reminder.type
      && current.dueAt.getTime() === reminder.dueAt.getTime()
    )));
    this.reminders.push(...missing);
    return missing.length;
  }
}

const opportunity = (overrides: Partial<OpportunityForAutomation> = {}): OpportunityForAutomation => ({
  id: 'opportunity-id',
  stage: OpportunityStage.FOLLOW_UP,
  lastContactAt: null,
  nextFollowUpAt: null,
  proposalValidUntil: null,
  customerEventAt: null,
  ...overrides,
});

describe('FollowUpMonitorService', () => {
  const now = new Date('2026-10-15T12:00:00.000Z');

  it('creates reminders for overdue follow-up, expired proposal and approaching event', async () => {
    const opportunities = new InMemoryOpportunityAutomationRepository([opportunity({
      nextFollowUpAt: new Date('2026-10-14T12:00:00.000Z'),
      proposalValidUntil: new Date('2026-10-14T00:00:00.000Z'),
      customerEventAt: new Date('2026-10-20T00:00:00.000Z'),
    })]);
    const reminders = new InMemoryReminderRepository();

    const created = await new FollowUpMonitorService(opportunities, reminders).execute(now);

    expect(created).toBe(3);
    expect(reminders.reminders.map((reminder) => reminder.type)).toEqual([
      ReminderType.FOLLOW_UP_OVERDUE,
      ReminderType.PROPOSAL_EXPIRED,
      ReminderType.CUSTOMER_EVENT_APPROACHING,
    ]);
  });

  it('uses the documented windows for follow-up due, proposal expiring and missing next follow-up', async () => {
    const opportunities = new InMemoryOpportunityAutomationRepository([
      opportunity({ id: 'due', nextFollowUpAt: new Date('2026-10-16T10:00:00.000Z') }),
      opportunity({ id: 'proposal', proposalValidUntil: new Date('2026-10-17T00:00:00.000Z') }),
      opportunity({ id: 'no-follow-up', lastContactAt: new Date('2026-10-12T10:00:00.000Z') }),
    ]);
    const reminders = new InMemoryReminderRepository();

    await new FollowUpMonitorService(opportunities, reminders).execute(now);

    expect(reminders.reminders).toEqual(expect.arrayContaining([
      expect.objectContaining({ opportunityId: 'due', type: ReminderType.FOLLOW_UP_DUE }),
      expect.objectContaining({ opportunityId: 'proposal', type: ReminderType.PROPOSAL_EXPIRING }),
      expect.objectContaining({ opportunityId: 'no-follow-up', type: ReminderType.FOLLOW_UP_OVERDUE }),
    ]));
  });

  it('is idempotent and does not mutate commercial stages', async () => {
    const source = opportunity({ stage: OpportunityStage.FORECAST, nextFollowUpAt: new Date('2026-10-14T12:00:00.000Z') });
    const opportunities = new InMemoryOpportunityAutomationRepository([source]);
    const reminders = new InMemoryReminderRepository();
    const service = new FollowUpMonitorService(opportunities, reminders);

    expect(await service.execute(now)).toBe(1);
    expect(await service.execute(now)).toBe(0);
    expect(source.stage).toBe(OpportunityStage.FORECAST);
  });
});
