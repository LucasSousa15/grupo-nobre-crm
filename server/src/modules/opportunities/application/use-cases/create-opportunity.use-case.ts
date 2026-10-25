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
    Opportunity.assertEventDateProvided(input.customerEventAt);
    Opportunity.assertDatesAreNotInPast(input.customerEventAt, input.proposalValidUntil);
    Opportunity.assertProposalDeadline(input.proposalValidUntil, input.customerEventAt);
    const items = input.items ?? [];
    await this.validateReferences(input.companyId, input.sellerId, items);
    const code = await this.generateCode(input.companyId);
    const estimatedValue = await this.calculateEstimatedValue(items);
    return this.opportunities.create({ ...input, code, estimatedValue });
  }

  private async generateCode(companyId: string): Promise<string> {
    const companyCode = await this.references.companyCode(companyId);
    if (!companyCode) throw new OpportunityReferenceInvalidError('A empresa informada não existe.');
    for (let sequence = 1; sequence < 10000; sequence += 1) {
      const code = `${companyCode}${String(sequence).padStart(3, '0')}`;
      if (!(await this.opportunities.findByCode(code))) return code;
    }
    throw new OpportunityCodeAlreadyUsedError();
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

  private async calculateEstimatedValue(items: OpportunityItemInput[]): Promise<number | undefined> {
    if (items.length === 0) return undefined;
    const prices = await this.references.findActiveProductUnitPrices(items.map((item) => item.productId));
    const total = items.reduce((sum, item) => sum + (prices.get(item.productId) ?? 0) * item.quantity, 0);
    return Math.round(total * 100) / 100;
  }
}
