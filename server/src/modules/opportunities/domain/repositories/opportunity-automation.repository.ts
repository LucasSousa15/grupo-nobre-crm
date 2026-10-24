import { OpportunityStage } from '../types/opportunity-stage';

export interface OpportunityForAutomation {
  id: string;
  stage: OpportunityStage;
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
  proposalValidUntil: Date | null;
  customerEventAt: Date | null;
}

export abstract class OpportunityAutomationRepository {
  abstract findOpenForAutomation(): Promise<OpportunityForAutomation[]>;
}
