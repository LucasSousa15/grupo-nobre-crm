import { z } from "zod";
import { attentionStatuses, opportunityStages } from "@/hooks/opportunities/types";

const opportunitySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  stage: z.enum(opportunityStages),
  attentionStatus: z.enum(attentionStatuses),
  estimatedValue: z.number().nullable(),
  lastContactAt: z.string().nullable(),
  nextFollowUpAt: z.string().nullable(),
  proposalValidUntil: z.string().nullable(),
  customerEventAt: z.string().nullable(),
  lossReason: z.string().nullable(),
  company: z.object({ id: z.string().uuid(), name: z.string() }),
  seller: z.object({ id: z.string().uuid(), name: z.string() }),
  items: z.array(z.object({ id: z.string().uuid(), productId: z.string().uuid(), productName: z.string(), quantity: z.number().int().positive() })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const opportunitiesResponseSchema = z.object({
  opportunities: z.array(opportunitySchema),
});
