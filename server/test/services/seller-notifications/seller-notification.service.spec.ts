import { Logger } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReminderType } from "src/modules/reminders/domain/types/reminder";
import { SellerNotificationService } from "src/services/seller-notifications/seller-notification.service";

describe("SellerNotificationService", () => {
  const log = vi
    .spyOn(Logger.prototype, "log")
    .mockImplementation(() => undefined);
  const warn = vi
    .spyOn(Logger.prototype, "warn")
    .mockImplementation(() => undefined);

  afterEach(() => vi.clearAllMocks());

  it("simulates email and SMS when the seller has a phone number", async () => {
    const service = new SellerNotificationService();

    await service.sendFollowUpNotification({
      seller: {
        name: "Ana",
        email: "ana@nobrebrindes.local",
        phone: "+55 11 99999-9999",
      },
      opportunityCode: "OPP-2001",
      type: ReminderType.FOLLOW_UP_DUE,
      dueAt: new Date("2026-10-16T10:00:00.000Z"),
    });

    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("ana@nobrebrindes.local"),
    );
    expect(log).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("+55 11 99999-9999"),
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("simulates only email when the seller has no phone number", async () => {
    const service = new SellerNotificationService();

    await service.sendFollowUpNotification({
      seller: { name: "Ana", email: "ana@nobrebrindes.local", phone: null },
      opportunityCode: "OPP-2001",
      type: ReminderType.FOLLOW_UP_DUE,
      dueAt: new Date("2026-10-16T10:00:00.000Z"),
    });

    expect(log).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Ana"));
  });

  it("identifies the event date as the final commercial deadline", async () => {
    const service = new SellerNotificationService();

    await service.sendFollowUpNotification({
      seller: {
        name: "Ana",
        email: "ana@nobrebrindes.local",
        phone: "+55 11 99999-9999",
      },
      opportunityCode: "OPP-2001",
      type: ReminderType.CUSTOMER_EVENT_APPROACHING,
      dueAt: new Date("2026-10-15T00:00:00.000Z"),
      customerEventAt: new Date("2026-10-20T00:00:00.000Z"),
    });

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("2026-10-20T00:00:00.000Z"),
    );
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("prazo comercial final"),
    );
  });
});
