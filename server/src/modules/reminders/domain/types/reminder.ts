export enum ReminderType {
  FOLLOW_UP_DUE = 'FOLLOW_UP_DUE',
  FOLLOW_UP_OVERDUE = 'FOLLOW_UP_OVERDUE',
  PROPOSAL_EXPIRING = 'PROPOSAL_EXPIRING',
  PROPOSAL_EXPIRED = 'PROPOSAL_EXPIRED',
  CUSTOMER_EVENT_APPROACHING = 'CUSTOMER_EVENT_APPROACHING',
}

export enum ReminderStatus {
  OPEN = 'OPEN',
  DISMISSED = 'DISMISSED',
}

export interface CreateReminderInput {
  opportunityId: string;
  type: ReminderType;
  dueAt: Date;
}

export interface ReminderDetails extends CreateReminderInput {
  id: string;
  status: ReminderStatus;
  createdAt: Date;
}
