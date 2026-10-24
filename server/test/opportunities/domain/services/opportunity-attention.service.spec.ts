import { describe, expect, it } from 'vitest';
import { ReminderType } from 'src/modules/reminders/domain/types/reminder';
import { OpportunityAttentionService, OpportunityAttentionStatus } from 'src/modules/opportunities/domain/services/opportunity-attention.service';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';

const now = new Date('2026-10-15T12:00:00.000Z');
const input = (overrides: Partial<Parameters<typeof OpportunityAttentionService.calculate>[0]> = {}) => ({
  stage: OpportunityStage.FOLLOW_UP,
  lastContactAt: new Date('2026-10-10T12:00:00.000Z'),
  nextFollowUpAt: null,
  reminders: [],
  ...overrides,
});

describe('OpportunityAttentionService', () => {
  it('returns normal when no follow-up action needs attention', () => {
    expect(OpportunityAttentionService.calculate(input(), now)).toBe(OpportunityAttentionStatus.NORMAL);
  });

  it('returns due soon when the next follow-up is within one day', () => {
    expect(OpportunityAttentionService.calculate(input({ nextFollowUpAt: new Date('2026-10-16T10:00:00.000Z') }), now)).toBe(OpportunityAttentionStatus.DUE_SOON);
  });

  it('returns overdue after one overdue follow-up reminder since the last contact', () => {
    expect(OpportunityAttentionService.calculate(input({
      reminders: [{ type: ReminderType.FOLLOW_UP_OVERDUE, createdAt: new Date('2026-10-14T08:00:00.000Z') }],
    }), now)).toBe(OpportunityAttentionStatus.OVERDUE);
  });

  it('returns critical after two overdue follow-up reminders since the last contact', () => {
    expect(OpportunityAttentionService.calculate(input({
      reminders: [
        { type: ReminderType.FOLLOW_UP_OVERDUE, createdAt: new Date('2026-10-13T08:00:00.000Z') },
        { type: ReminderType.FOLLOW_UP_OVERDUE, createdAt: new Date('2026-10-14T08:00:00.000Z') },
      ],
    }), now)).toBe(OpportunityAttentionStatus.CRITICAL);
  });

  it('resets the overdue reminder count after a new seller contact', () => {
    expect(OpportunityAttentionService.calculate(input({
      lastContactAt: new Date('2026-10-15T09:00:00.000Z'),
      reminders: [
        { type: ReminderType.FOLLOW_UP_OVERDUE, createdAt: new Date('2026-10-13T08:00:00.000Z') },
        { type: ReminderType.FOLLOW_UP_OVERDUE, createdAt: new Date('2026-10-14T08:00:00.000Z') },
      ],
    }), now)).toBe(OpportunityAttentionStatus.NORMAL);
  });

  it('returns normal for final stages', () => {
    expect(OpportunityAttentionService.calculate(input({
      stage: OpportunityStage.CLOSED,
      reminders: [
        { type: ReminderType.FOLLOW_UP_OVERDUE, createdAt: new Date('2026-10-13T08:00:00.000Z') },
        { type: ReminderType.FOLLOW_UP_OVERDUE, createdAt: new Date('2026-10-14T08:00:00.000Z') },
      ],
    }), now)).toBe(OpportunityAttentionStatus.NORMAL);
  });
});
