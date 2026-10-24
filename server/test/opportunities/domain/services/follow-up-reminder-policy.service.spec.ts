import { describe, expect, it } from "vitest";
import { ReminderType } from "src/modules/reminders/domain/types/reminder";
import {
  FollowUpReminderPolicy,
  OpportunityForFollowUpPolicy,
} from "src/modules/opportunities/domain/services/follow-up-reminder-policy.service";

const now = new Date("2026-10-15T12:00:00.000Z");
const opportunity = (
  overrides: Partial<OpportunityForFollowUpPolicy> = {},
): OpportunityForFollowUpPolicy => ({
  id: "opportunity-id",
  lastContactAt: null,
  nextFollowUpAt: null,
  proposalValidUntil: null,
  customerEventAt: new Date("2026-12-31T00:00:00.000Z"),
  ...overrides,
});

describe("FollowUpReminderPolicy", () => {
  it("creates an overdue follow-up reminder for each overdue day", () => {
    const source = opportunity({
      nextFollowUpAt: new Date("2026-10-14T12:00:00.000Z"),
    });

    expect(FollowUpReminderPolicy.collect(source, now)).toEqual([
      {
        opportunityId: "opportunity-id",
        type: ReminderType.FOLLOW_UP_OVERDUE,
        dueAt: new Date("2026-10-15T00:00:00.000Z"),
      },
    ]);
    expect(
      FollowUpReminderPolicy.collect(
        source,
        new Date("2026-10-16T12:00:00.000Z"),
      ),
    ).toEqual([
      {
        opportunityId: "opportunity-id",
        type: ReminderType.FOLLOW_UP_OVERDUE,
        dueAt: new Date("2026-10-16T00:00:00.000Z"),
      },
    ]);
  });

  it("creates due-soon, proposal and customer-event reminders within their documented windows", () => {
    const reminders = FollowUpReminderPolicy.collect(
      opportunity({
        nextFollowUpAt: new Date("2026-10-16T10:00:00.000Z"),
        proposalValidUntil: new Date("2026-10-17T00:00:00.000Z"),
        customerEventAt: new Date("2026-10-20T00:00:00.000Z"),
      }),
      now,
    );

    expect(reminders.map((reminder) => reminder.type)).toEqual([
      ReminderType.FOLLOW_UP_DUE,
      ReminderType.PROPOSAL_EXPIRING,
      ReminderType.CUSTOMER_EVENT_APPROACHING,
    ]);
  });

  it("creates one event-deadline reminder per day during the final seven-day window", () => {
    const source = opportunity({
      customerEventAt: new Date("2026-10-20T00:00:00.000Z"),
    });

    expect(FollowUpReminderPolicy.collect(source, now)).toContainEqual({
      opportunityId: "opportunity-id",
      type: ReminderType.CUSTOMER_EVENT_APPROACHING,
      dueAt: new Date("2026-10-15T00:00:00.000Z"),
    });
    expect(
      FollowUpReminderPolicy.collect(
        source,
        new Date("2026-10-16T12:00:00.000Z"),
      ),
    ).toContainEqual({
      opportunityId: "opportunity-id",
      type: ReminderType.CUSTOMER_EVENT_APPROACHING,
      dueAt: new Date("2026-10-16T00:00:00.000Z"),
    });
  });

  it("ignores a stale next follow-up after a new contact", () => {
    const reminders = FollowUpReminderPolicy.collect(
      opportunity({
        lastContactAt: new Date("2026-10-15T07:00:00.000Z"),
        nextFollowUpAt: new Date("2026-10-14T12:00:00.000Z"),
      }),
      now,
    );

    expect(reminders).toEqual([]);
  });
});
