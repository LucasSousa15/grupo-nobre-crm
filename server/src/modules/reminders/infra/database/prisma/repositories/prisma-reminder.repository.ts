import { Injectable } from '@nestjs/common';
import { ReminderType as PrismaReminderType } from '@prisma/client';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { ReminderRepository } from 'src/modules/reminders/domain/repositories/reminder.repository';
import { CreateReminderInput } from 'src/modules/reminders/domain/types/reminder';

@Injectable()
export class PrismaReminderRepository implements ReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createManyIfAbsent(reminders: CreateReminderInput[]): Promise<CreateReminderInput[]> {
    if (reminders.length === 0) return [];
    const records = reminders.map((reminder) => ({ id: crypto.randomUUID(), ...reminder }));
    await this.prisma.reminder.createMany({
      data: records.map((record) => ({ ...record, type: record.type as PrismaReminderType })),
      skipDuplicates: true,
    });
    const persisted = await this.prisma.reminder.findMany({ where: { id: { in: records.map((record) => record.id) } }, select: { id: true } });
    const persistedIds = new Set(persisted.map((reminder) => reminder.id));
    return records.filter((record) => persistedIds.has(record.id)).map(({ id: _id, ...reminder }) => reminder);
  }
}
