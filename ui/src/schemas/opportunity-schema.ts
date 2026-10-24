import { z } from "zod";
import { attentionStatuses, opportunityStages } from "@/hooks/opportunities/types";

const opportunitySchema = z.object({
  // Identificadores são opacos para a interface: o seed utiliza chaves estáveis
  // textuais em relações internas e a UI não deve assumir UUIDs como contrato.
  id: z.string().min(1),
  code: z.string(),
  stage: z.enum(opportunityStages),
  attentionStatus: z.enum(attentionStatuses),
  estimatedValue: z.number().nullable(),
  lastContactAt: z.string().nullable(),
  nextFollowUpAt: z.string().nullable(),
  proposalValidUntil: z.string().nullable(),
  customerEventAt: z.string(),
  lossReason: z.string().nullable(),
  company: z.object({ id: z.string().min(1), name: z.string() }),
  seller: z.object({ id: z.string().min(1), name: z.string() }),
  items: z.array(z.object({ id: z.string().min(1), productId: z.string().min(1), productName: z.string(), quantity: z.number().int().positive() })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const opportunitiesResponseSchema = z.object({
  opportunities: z.array(opportunitySchema),
});
