import { Module } from '@nestjs/common';
import { ReminderRepository } from './domain/repositories/reminder.repository';
import { PrismaReminderRepository } from './infra/database/prisma/repositories/prisma-reminder.repository';

@Module({
  providers: [PrismaReminderRepository, { provide: ReminderRepository, useExisting: PrismaReminderRepository }],
  exports: [ReminderRepository],
})
export class RemindersModule {}
