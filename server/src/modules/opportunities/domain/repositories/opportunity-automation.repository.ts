import { OpportunityStage } from '../types/opportunity-stage';

export interface OpportunityForAutomation {
  id: string;
  code: string;
  stage: OpportunityStage;
  seller: { name: string; email: string; phone: string | null };
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
  proposalValidUntil: Date | null;
  customerEventAt: Date;
}

export abstract class OpportunityAutomationRepository {
  abstract findOpenForAutomation(): Promise<OpportunityForAutomation[]>;
}
