import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { OpportunityManagementRepository } from '../../domain/repositories/opportunity-management.repository';
import { OpportunityStage } from '../../domain/types/opportunity-stage';
import { OpportunityCannotBeDeletedError } from '../errors/opportunity-cannot-be-deleted.error';

@Injectable()
export class DeleteOpportunityUseCase {
  constructor(private readonly opportunities: OpportunityManagementRepository) {}

  async execute(id: string): Promise<void> {
    const opportunity = await this.opportunities.findDetailsById(id);
    if (!opportunity) throw new ResourceNotFoundError('Oportunidade');
    if (opportunity.stage !== OpportunityStage.FIRST_CONTACT) throw new OpportunityCannotBeDeletedError();
    await this.opportunities.delete(id);
  }
}
