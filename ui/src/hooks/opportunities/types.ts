export const opportunityStages = [
  "FIRST_CONTACT",
  "QUOTE_PRESENTATION",
  "FOLLOW_UP",
  "FORECAST",
  "CLOSED",
  "LOST",
] as const;

export const attentionStatuses = ["NORMAL", "DUE_SOON", "OVERDUE", "CRITICAL"] as const;

export type OpportunityStage = (typeof opportunityStages)[number];
export type AttentionStatus = (typeof attentionStatuses)[number];

export interface Opportunity {
  id: string;
  code: string;
  stage: OpportunityStage;
  attentionStatus: AttentionStatus;
  estimatedValue: number | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  proposalValidUntil: string | null;
  customerEventAt: string;
  lossReason: string | null;
  company: { id: string; name: string };
  seller: { id: string; name: string };
  items: Array<{ id: string; productId: string; productName: string; quantity: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityFilters {
  attentionStatus?: AttentionStatus;
}

export const stageLabels: Record<OpportunityStage, string> = {
  FIRST_CONTACT: "Primeiro contato",
  QUOTE_PRESENTATION: "Orçamento",
  FOLLOW_UP: "Follow-up",
  FORECAST: "Forecast",
  CLOSED: "Fechada",
  LOST: "Perdida",
};

export const attentionLabels: Record<AttentionStatus, string> = {
  NORMAL: "Normal",
  DUE_SOON: "Próxima",
  OVERDUE: "Vencida",
  CRITICAL: "Crítica",
};
