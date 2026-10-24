import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { OpportunityManagementRepository } from '../../domain/repositories/opportunity-management.repository';
import { FindOpportunitiesFilters, OpportunityDetails, OpportunityPage, OpportunityStageHistory } from '../../domain/types/opportunity';

@Injectable()
export class FindOpportunitiesUseCase {
  constructor(private readonly opportunities: OpportunityManagementRepository) {}

  async byId(id: string): Promise<OpportunityDetails> {
    const opportunity = await this.opportunities.findDetailsById(id);
    if (!opportunity) throw new ResourceNotFoundError('Oportunidade');
    return opportunity;
  }

  async all(filters: FindOpportunitiesFilters): Promise<OpportunityPage> {
    return this.opportunities.findMany(filters);
  }

  async history(opportunityId: string): Promise<OpportunityStageHistory[]> {
    await this.byId(opportunityId);
    return this.opportunities.findStageHistoryByOpportunityId(opportunityId);
  }
}
