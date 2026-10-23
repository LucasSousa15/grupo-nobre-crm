import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { Opportunity } from '../../domain/entities/opportunity.entity';
import { OpportunityRepository } from '../../domain/repositories/opportunity.repository';
import { OpportunityStage } from '../../domain/types/opportunity-stage';

export interface ChangeOpportunityStageInput {
  opportunityId: string;
  stage: OpportunityStage;
  lossReason?: string;
}

@Injectable()
export class ChangeOpportunityStageUseCase {
  constructor(private readonly opportunities: OpportunityRepository) {}

  async execute(input: ChangeOpportunityStageInput): Promise<void> {
    const snapshot = await this.opportunities.findById(input.opportunityId);
    if (!snapshot) throw new ResourceNotFoundError('Oportunidade');

    const opportunity = Opportunity.restore(snapshot);
    opportunity.assertCanChangeStage(input.stage, input.lossReason);

    await this.opportunities.recordStageTransition({
      opportunityId: opportunity.id,
      fromStage: opportunity.stage,
      toStage: input.stage,
      lossReason: input.lossReason?.trim(),
    });
  }
}
