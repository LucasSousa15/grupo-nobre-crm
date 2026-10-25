import { Injectable } from '@nestjs/common';
import { ReminderStatus as PrismaReminderStatus, ReminderType as PrismaReminderType } from '@prisma/client';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { ReminderRepository } from 'src/modules/reminders/domain/repositories/reminder.repository';
import { CreateReminderInput, ReminderDetails, ReminderStatus, ReminderType } from 'src/modules/reminders/domain/types/reminder';

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

  async findByOpportunityId(opportunityId: string): Promise<ReminderDetails[]> {
    const reminders = await this.prisma.reminder.findMany({ where: { opportunityId }, orderBy: [{ status: 'asc' }, { dueAt: 'asc' }] });
    return reminders.map((reminder) => ({
      id: reminder.id,
      opportunityId: reminder.opportunityId,
      type: reminder.type as ReminderType,
      status: reminder.status as ReminderStatus,
      dueAt: reminder.dueAt,
      createdAt: reminder.createdAt,
    }));
  }

  async dismiss(reminderId: string, opportunityId: string): Promise<boolean> {
    const updated = await this.prisma.reminder.updateMany({
      where: { id: reminderId, opportunityId, status: PrismaReminderStatus.OPEN },
      data: { status: PrismaReminderStatus.DISMISSED },
    });
    return updated.count === 1;
  }

  async dismissOpenFollowUps(opportunityId: string): Promise<void> {
    await this.prisma.reminder.updateMany({
      where: { opportunityId, status: PrismaReminderStatus.OPEN, type: { in: [PrismaReminderType.FOLLOW_UP_DUE, PrismaReminderType.FOLLOW_UP_OVERDUE] } },
      data: { status: PrismaReminderStatus.DISMISSED },
    });
  }
}
