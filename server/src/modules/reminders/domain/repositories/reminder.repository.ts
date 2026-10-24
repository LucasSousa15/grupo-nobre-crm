import { CreateReminderInput } from '../types/reminder';

export abstract class ReminderRepository {
  abstract createManyIfAbsent(reminders: CreateReminderInput[]): Promise<CreateReminderInput[]>;
}
