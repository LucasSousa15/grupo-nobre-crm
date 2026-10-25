import { CreateReminderInput, ReminderDetails } from '../types/reminder';

export abstract class ReminderRepository {
  abstract createManyIfAbsent(reminders: CreateReminderInput[]): Promise<CreateReminderInput[]>;
  abstract findByOpportunityId(opportunityId: string): Promise<ReminderDetails[]>;
  abstract dismiss(reminderId: string, opportunityId: string): Promise<boolean>;
  abstract dismissOpenFollowUps(opportunityId: string): Promise<void>;
}
