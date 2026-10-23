import { OpportunitySnapshot } from '../entities/opportunity.entity';
import { OpportunityStage } from '../types/opportunity-stage';

export interface RecordStageTransitionInput {
  opportunityId: string;
  fromStage: OpportunityStage;
  toStage: OpportunityStage;
  lossReason?: string;
}

export abstract class OpportunityRepository {
  abstract findById(id: string): Promise<OpportunitySnapshot | null>;
  abstract recordStageTransition(input: RecordStageTransitionInput): Promise<void>;
}
