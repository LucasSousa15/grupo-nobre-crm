import { ReminderStatus, ReminderType } from 'src/modules/reminders/domain/types/reminder';
import { FOLLOW_UP_DUE_WINDOW_DAYS } from './follow-up-reminder-policy.service';
import { OpportunityStage } from '../types/opportunity-stage';

export enum OpportunityAttentionStatus {
  NORMAL = 'NORMAL',
  DUE_SOON = 'DUE_SOON',
  OVERDUE = 'OVERDUE',
  CRITICAL = 'CRITICAL',
}

export interface OpportunityReminderForAttention {
  type: ReminderType;
  createdAt: Date;
  status?: ReminderStatus;
}

export interface OpportunityAttentionInput {
  stage: OpportunityStage;
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
  reminders: OpportunityReminderForAttention[];
}

export class OpportunityAttentionService {
  static calculate(input: OpportunityAttentionInput, now = new Date()): OpportunityAttentionStatus {
    if (input.stage === OpportunityStage.CLOSED || input.stage === OpportunityStage.LOST) {
      return OpportunityAttentionStatus.NORMAL;
    }

    const overdueFollowUpReminders = input.reminders.filter((reminder) => (
      reminder.type === ReminderType.FOLLOW_UP_OVERDUE
      && reminder.status !== ReminderStatus.DISMISSED
      && (!input.lastContactAt || reminder.createdAt > input.lastContactAt)
    ));

    if (overdueFollowUpReminders.length >= 2) return OpportunityAttentionStatus.CRITICAL;
    if (overdueFollowUpReminders.length === 1) return OpportunityAttentionStatus.OVERDUE;

    if (input.nextFollowUpAt && input.nextFollowUpAt > now && input.nextFollowUpAt <= this.addDays(now, FOLLOW_UP_DUE_WINDOW_DAYS)) {
      return OpportunityAttentionStatus.DUE_SOON;
    }

    return OpportunityAttentionStatus.NORMAL;
  }

  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}
