import { OpportunitySnapshot } from 'src/modules/opportunities/domain/entities/opportunity.entity';
import { OpportunityRepository, RecordStageTransitionInput } from 'src/modules/opportunities/domain/repositories/opportunity.repository';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';

export class InMemoryOpportunityRepository implements OpportunityRepository {
  readonly histories: Array<RecordStageTransitionInput & { changedAt: Date }> = [];
  constructor(readonly opportunities: OpportunitySnapshot[] = []) {}

  async findById(id: string): Promise<OpportunitySnapshot | null> {
    return this.opportunities.find((opportunity) => opportunity.id === id) ?? null;
  }

  async recordStageTransition(input: RecordStageTransitionInput): Promise<void> {
    const opportunity = await this.findById(input.opportunityId);
    if (!opportunity || opportunity.stage !== input.fromStage) throw new Error('Concurrent modification');
    opportunity.stage = input.toStage as OpportunityStage;
    this.histories.push({ ...input, changedAt: new Date() });
  }
}
