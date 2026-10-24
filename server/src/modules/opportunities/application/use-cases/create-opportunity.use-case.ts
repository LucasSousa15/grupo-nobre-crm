import { Injectable } from '@nestjs/common';
import { OpportunityCodeAlreadyUsedError } from '../errors/opportunity-code-already-used.error';
import { OpportunityReferenceInvalidError } from '../errors/opportunity-reference-invalid.error';
import { OpportunityManagementRepository } from '../../domain/repositories/opportunity-management.repository';
import { OpportunityReferencesRepository } from '../../domain/repositories/opportunity-references.repository';
import { CreateOpportunityProps, OpportunityItemInput } from '../../domain/types/opportunity';
import { Opportunity } from '../../domain/entities/opportunity.entity';

@Injectable()
export class CreateOpportunityUseCase {
  constructor(
    private readonly opportunities: OpportunityManagementRepository,
    private readonly references: OpportunityReferencesRepository,
  ) {}

  async execute(input: CreateOpportunityProps) {
    const code = input.code.trim().toUpperCase();
    Opportunity.assertEventDateProvided(input.customerEventAt);
    Opportunity.assertProposalDeadline(input.proposalValidUntil, input.customerEventAt);
    if (await this.opportunities.findByCode(code)) throw new OpportunityCodeAlreadyUsedError();
    await this.validateReferences(input.companyId, input.sellerId, input.items ?? []);
    return this.opportunities.create({ ...input, code });
  }

  private async validateReferences(companyId: string, sellerId: string, items: OpportunityItemInput[]): Promise<void> {
    if (!(await this.references.companyExists(companyId))) {
      throw new OpportunityReferenceInvalidError('A empresa informada não existe.');
    }
    if (!(await this.references.sellerIsActive(sellerId))) {
      throw new OpportunityReferenceInvalidError('O vendedor informado não existe ou está inativo.');
    }
    Opportunity.assertItemsAreUnique(items);
    const productIds = items.map((item) => item.productId);
    const invalidProductIds = await this.references.findInactiveOrMissingProductIds(productIds);
    if (invalidProductIds.length > 0) {
      throw new OpportunityReferenceInvalidError('Um ou mais produtos informados não existem ou estão inativos.');
    }
  }
}
