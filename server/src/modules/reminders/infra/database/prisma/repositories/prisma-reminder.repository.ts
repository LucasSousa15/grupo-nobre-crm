import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { ReminderRepository } from 'src/modules/reminders/domain/repositories/reminder.repository';
import { CreateReminderInput } from 'src/modules/reminders/domain/types/reminder';

@Injectable()
export class PrismaReminderRepository implements ReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createManyIfAbsent(reminders: CreateReminderInput[]): Promise<number> {
    if (reminders.length === 0) return 0;
    const result = await this.prisma.reminder.createMany({
      data: reminders,
      skipDuplicates: true,
    });
    return result.count;
  }
}
