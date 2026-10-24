import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { OpportunityManagementRepository } from '../../domain/repositories/opportunity-management.repository';
import { Opportunity } from '../../domain/entities/opportunity.entity';

@Injectable()
export class DeleteOpportunityUseCase {
  constructor(private readonly opportunities: OpportunityManagementRepository) {}

  async execute(id: string): Promise<void> {
    const opportunity = await this.opportunities.findDetailsById(id);
    if (!opportunity) throw new ResourceNotFoundError('Oportunidade');
    Opportunity.restore({
      id: opportunity.id,
      code: opportunity.code,
      stage: opportunity.stage,
      estimatedValue: opportunity.estimatedValue,
      itemsCount: opportunity.items.length,
    }).assertCanBeDeleted();
    await this.opportunities.delete(id);
  }
}
