import { describe, expect, it, vi } from "vitest";
import {
  OpportunityAutomationRepository,
  OpportunityForAutomation,
} from "src/modules/opportunities/domain/repositories/opportunity-automation.repository";
import { ReminderRepository } from "src/modules/reminders/domain/repositories/reminder.repository";
import {
  CreateReminderInput,
  ReminderType,
} from "src/modules/reminders/domain/types/reminder";
import { FollowUpMonitorService } from "src/services/follow-up-monitor/follow-up-monitor.service";
import { SellerNotificationService } from "src/services/seller-notifications/seller-notification.service";
import { OpportunityStage } from "src/modules/opportunities/domain/types/opportunity-stage";
import { CloseExpiredOpportunityUseCase } from "src/modules/opportunities/application/use-cases/close-expired-opportunity.use-case";

class InMemoryOpportunityAutomationRepository implements OpportunityAutomationRepository {
  constructor(readonly opportunities: OpportunityForAutomation[]) {}
  async findOpenForAutomation(): Promise<OpportunityForAutomation[]> {
    return this.opportunities;
  }
}

class InMemoryReminderRepository implements ReminderRepository {
  readonly reminders: CreateReminderInput[] = [];

  async createManyIfAbsent(
    reminders: CreateReminderInput[],
  ): Promise<CreateReminderInput[]> {
    const missing = reminders.filter(
      (reminder) =>
        !this.reminders.some(
          (current) =>
            current.opportunityId === reminder.opportunityId &&
            current.type === reminder.type &&
            current.dueAt.getTime() === reminder.dueAt.getTime(),
        ),
    );
    this.reminders.push(...missing);
    return missing;
  }
}

const opportunity = (
  overrides: Partial<OpportunityForAutomation> = {},
): OpportunityForAutomation => ({
  id: "opportunity-id",
  code: "OPP-2001",
  stage: OpportunityStage.FOLLOW_UP,
  seller: {
    name: "Ana",
    email: "ana@nobrebrindes.local",
    phone: "+55 11 99999-9999",
  },
  lastContactAt: null,
  nextFollowUpAt: null,
  proposalValidUntil: null,
  customerEventAt: new Date("2026-12-31T00:00:00.000Z"),
  ...overrides,
});

describe("FollowUpMonitorService", () => {
  const now = new Date("2026-10-15T12:00:00.000Z");
  const notifications = () =>
    ({
      sendFollowUpNotification: vi.fn().mockResolvedValue(undefined),
    }) as unknown as SellerNotificationService;
  const automaticLosses = () =>
    ({
      execute: vi.fn().mockResolvedValue(false),
    }) as unknown as CloseExpiredOpportunityUseCase;

  it("creates reminders for overdue follow-up, expired proposal and approaching event", async () => {
    const opportunities = new InMemoryOpportunityAutomationRepository([
      opportunity({
        nextFollowUpAt: new Date("2026-10-14T12:00:00.000Z"),
        proposalValidUntil: new Date("2026-10-14T00:00:00.000Z"),
        customerEventAt: new Date("2026-11-03T00:00:00.000Z"),
      }),
    ]);
    const reminders = new InMemoryReminderRepository();
    const notifier = notifications();

    const created = await new FollowUpMonitorService(
      opportunities,
      reminders,
      notifier,
      automaticLosses(),
    ).execute(now);

    expect(created).toBe(3);
    expect(reminders.reminders.map((reminder) => reminder.type)).toEqual([
      ReminderType.FOLLOW_UP_OVERDUE,
      ReminderType.PROPOSAL_EXPIRED,
      ReminderType.CUSTOMER_EVENT_APPROACHING,
    ]);
    expect(notifier.sendFollowUpNotification).toHaveBeenCalledTimes(3);
  });

  it("uses the documented windows for follow-up due, proposal expiring and missing next follow-up", async () => {
    const opportunities = new InMemoryOpportunityAutomationRepository([
      opportunity({
        id: "due",
        nextFollowUpAt: new Date("2026-10-16T10:00:00.000Z"),
      }),
      opportunity({
        id: "proposal",
        proposalValidUntil: new Date("2026-10-17T00:00:00.000Z"),
      }),
      opportunity({
        id: "no-follow-up",
        lastContactAt: new Date("2026-10-12T10:00:00.000Z"),
      }),
    ]);
    const reminders = new InMemoryReminderRepository();
    const notifier = notifications();

    await new FollowUpMonitorService(
      opportunities,
      reminders,
      notifier,
      automaticLosses(),
    ).execute(now);

    expect(reminders.reminders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          opportunityId: "due",
          type: ReminderType.FOLLOW_UP_DUE,
        }),
        expect.objectContaining({
          opportunityId: "proposal",
          type: ReminderType.PROPOSAL_EXPIRING,
        }),
        expect.objectContaining({
          opportunityId: "no-follow-up",
          type: ReminderType.FOLLOW_UP_OVERDUE,
        }),
      ]),
    );
  });

  it("is idempotent and keeps opportunities open before the event deadline", async () => {
    const source = opportunity({
      stage: OpportunityStage.FORECAST,
      nextFollowUpAt: new Date("2026-10-14T12:00:00.000Z"),
    });
    const opportunities = new InMemoryOpportunityAutomationRepository([source]);
    const reminders = new InMemoryReminderRepository();
    const notifier = notifications();
    const service = new FollowUpMonitorService(
      opportunities,
      reminders,
      notifier,
      automaticLosses(),
    );

    expect(await service.execute(now)).toBe(1);
    expect(await service.execute(now)).toBe(0);
    expect(source.stage).toBe(OpportunityStage.FORECAST);
    expect(notifier.sendFollowUpNotification).toHaveBeenCalledTimes(1);
  });

  it("creates at most one overdue follow-up reminder per opportunity each day", async () => {
    const opportunities = new InMemoryOpportunityAutomationRepository([
      opportunity({ nextFollowUpAt: new Date("2026-10-14T12:00:00.000Z") }),
    ]);
    const reminders = new InMemoryReminderRepository();
    const notifier = notifications();
    const service = new FollowUpMonitorService(
      opportunities,
      reminders,
      notifier,
      automaticLosses(),
    );

    expect(await service.execute(new Date("2026-10-15T08:00:00.000Z"))).toBe(1);
    expect(await service.execute(new Date("2026-10-15T16:00:00.000Z"))).toBe(0);
    expect(await service.execute(new Date("2026-10-16T08:00:00.000Z"))).toBe(1);
    expect(reminders.reminders).toMatchObject([
      {
        type: ReminderType.FOLLOW_UP_OVERDUE,
        dueAt: new Date("2026-10-15T00:00:00.000Z"),
      },
      {
        type: ReminderType.FOLLOW_UP_OVERDUE,
        dueAt: new Date("2026-10-16T00:00:00.000Z"),
      },
    ]);
    expect(notifier.sendFollowUpNotification).toHaveBeenCalledTimes(2);
  });

  it("notifies the seller once per day while the event deadline is within seven days", async () => {
    const opportunities = new InMemoryOpportunityAutomationRepository([
      opportunity({ customerEventAt: new Date("2026-11-03T00:00:00.000Z") }),
    ]);
    const reminders = new InMemoryReminderRepository();
    const notifier = notifications();
    const service = new FollowUpMonitorService(
      opportunities,
      reminders,
      notifier,
      automaticLosses(),
    );

    expect(await service.execute(new Date("2026-10-15T08:00:00.000Z"))).toBe(1);
    expect(await service.execute(new Date("2026-10-15T16:00:00.000Z"))).toBe(0);
    expect(await service.execute(new Date("2026-10-16T08:00:00.000Z"))).toBe(1);
    expect(reminders.reminders).toMatchObject([
      {
        type: ReminderType.CUSTOMER_EVENT_APPROACHING,
        dueAt: new Date("2026-10-15T00:00:00.000Z"),
      },
      {
        type: ReminderType.CUSTOMER_EVENT_APPROACHING,
        dueAt: new Date("2026-10-16T00:00:00.000Z"),
      },
    ]);
    expect(notifier.sendFollowUpNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEventAt: new Date("2026-11-03T00:00:00.000Z"),
      }),
    );
  });

  it("stops generating reminders after an opportunity is automatically lost", async () => {
    const opportunities = new InMemoryOpportunityAutomationRepository([
      opportunity({ customerEventAt: new Date("2026-10-14T00:00:00.000Z") }),
    ]);
    const reminders = new InMemoryReminderRepository();
    const notifier = notifications();
    const automaticLoss = {
      execute: vi.fn().mockResolvedValue(true),
    } as unknown as CloseExpiredOpportunityUseCase;

    expect(
      await new FollowUpMonitorService(
        opportunities,
        reminders,
        notifier,
        automaticLoss,
      ).execute(now),
    ).toBe(0);
    expect(automaticLoss.execute).toHaveBeenCalledWith("opportunity-id", now);
    expect(reminders.reminders).toHaveLength(0);
    expect(notifier.sendFollowUpNotification).not.toHaveBeenCalled();
  });

  it("ignores a stale next follow-up after the seller records a new contact", async () => {
    const opportunities = new InMemoryOpportunityAutomationRepository([
      opportunity({
        lastContactAt: new Date("2026-10-15T07:00:00.000Z"),
        nextFollowUpAt: new Date("2026-10-14T12:00:00.000Z"),
      }),
    ]);
    const reminders = new InMemoryReminderRepository();
    const notifier = notifications();

    expect(
      await new FollowUpMonitorService(
        opportunities,
        reminders,
        notifier,
        automaticLosses(),
      ).execute(new Date("2026-10-15T12:00:00.000Z")),
    ).toBe(0);
    expect(reminders.reminders).toHaveLength(0);
    expect(notifier.sendFollowUpNotification).not.toHaveBeenCalled();
  });
});
