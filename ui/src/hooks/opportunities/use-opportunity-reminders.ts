'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { crmApi } from '@/http/api';

const reminderSchema = z.object({
  id: z.string().uuid(),
  opportunityId: z.string().uuid(),
  type: z.enum(['FOLLOW_UP_DUE', 'FOLLOW_UP_OVERDUE', 'PROPOSAL_EXPIRING', 'PROPOSAL_EXPIRED', 'CUSTOMER_EVENT_APPROACHING']),
  status: z.enum(['OPEN', 'DISMISSED']),
  dueAt: z.string(),
  createdAt: z.string(),
});

const remindersResponseSchema = z.object({ reminders: z.array(reminderSchema) });
export type OpportunityReminder = z.infer<typeof reminderSchema>;

export function useOpportunityReminders(opportunityId: string) {
  return useQuery({
    queryKey: ['opportunities', opportunityId, 'reminders'],
    queryFn: async () => remindersResponseSchema.parse((await crmApi.get(`/opportunities/${opportunityId}/reminders`)).data).reminders,
  });
}
