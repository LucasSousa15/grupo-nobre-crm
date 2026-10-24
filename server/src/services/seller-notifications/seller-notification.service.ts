import { Injectable, Logger } from "@nestjs/common";
import { ReminderType } from "src/modules/reminders/domain/types/reminder";

export interface SellerReminderNotification {
  seller: { name: string; email: string; phone: string | null };
  opportunityCode: string;
  type: ReminderType;
  dueAt: Date;
  customerEventAt?: Date;
}

@Injectable()
export class SellerNotificationService {
  private readonly logger = new Logger(SellerNotificationService.name);

  async sendFollowUpNotification(
    notification: SellerReminderNotification,
  ): Promise<void> {
    const subject = `[CRM Nobre] Follow-up action required for ${notification.opportunityCode}`;
    const content =
      notification.type === ReminderType.CUSTOMER_EVENT_APPROACHING
        ? `${notification.type} - evento em ${notification.customerEventAt?.toISOString() ?? notification.dueAt.toISOString()} (prazo comercial final)`
        : `${notification.type} - prazo: ${notification.dueAt.toISOString()}`;

    this.logger.log(
      `[E-MAIL SIMULADO] Para: ${notification.seller.email} | Assunto: ${subject} | ${content}`,
    );
    if (notification.seller.phone) {
      this.logger.log(
        `[SMS SIMULADO] Para: ${notification.seller.phone} | ${subject} | ${content}`,
      );
    } else {
      this.logger.warn(
        `[SMS NOT SENT] ${notification.seller.name} has no phone number registered.`,
      );
    }
  }
}
