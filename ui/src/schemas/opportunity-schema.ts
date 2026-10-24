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
  transitionOptions: z.array(z.object({
    stage: z.enum(opportunityStages),
    enabled: z.boolean(),
    requirements: z.array(z.string()),
    requiresLossReason: z.boolean(),
  })).optional().default([]),
  company: z.object({
    id: z.string().min(1),
    name: z.string(),
    contactName: z.string().optional().default("Contato não informado"),
    contactEmail: z.string().email().nullable().optional().default(null),
    contactPhone: z.string().min(1).nullable().optional().default(null),
  }),
  seller: z.object({ id: z.string().min(1), name: z.string() }),
  items: z.array(z.object({ id: z.string().min(1), productId: z.string().min(1), productName: z.string(), quantity: z.number().int().positive() })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const opportunitiesResponseSchema = z.object({
  opportunities: z.array(opportunitySchema),
  nextCursor: z.string().min(1).nullable().optional().default(null),
  total: z.number().int().nonnegative().optional().default(0),
  attentionSummary: z.object({
    NORMAL: z.number().int().nonnegative(),
    DUE_SOON: z.number().int().nonnegative(),
    OVERDUE: z.number().int().nonnegative(),
    CRITICAL: z.number().int().nonnegative(),
  }).optional().default({ NORMAL: 0, DUE_SOON: 0, OVERDUE: 0, CRITICAL: 0 }),
});

export const opportunityHistoryResponseSchema = z.object({
  history: z.array(z.object({
    id: z.string().min(1),
    fromStage: z.enum(opportunityStages),
    toStage: z.enum(opportunityStages),
    changedAt: z.string(),
  })),
});
