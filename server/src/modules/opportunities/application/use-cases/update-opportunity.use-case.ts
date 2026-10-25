import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { OpportunityManagementRepository } from '../../domain/repositories/opportunity-management.repository';
import { OpportunityReferencesRepository } from '../../domain/repositories/opportunity-references.repository';
import { OpportunityItemInput, UpdateOpportunityProps } from '../../domain/types/opportunity';
import { OpportunityReferenceInvalidError } from '../errors/opportunity-reference-invalid.error';
import { Opportunity } from '../../domain/entities/opportunity.entity';
import { ReminderRepository } from 'src/modules/reminders/domain/repositories/reminder.repository';
import { OpportunityPricingService } from '../../domain/services/opportunity-pricing.service';
import { OpportunityUpdateEmptyError } from '../errors/opportunity-update-empty.error';

@Injectable()
export class UpdateOpportunityUseCase {
  constructor(
    private readonly opportunities: OpportunityManagementRepository,
    private readonly references: OpportunityReferencesRepository,
    private readonly reminders?: ReminderRepository,
  ) {}

  async execute(id: string, input: UpdateOpportunityProps) {
    if (Object.values(input).every((value) => value === undefined)) {
      throw new OpportunityUpdateEmptyError();
    }

    const current = await this.opportunities.findDetailsById(id);
    if (!current) throw new ResourceNotFoundError('Oportunidade');

    Opportunity.restore({
      id: current.id,
      code: current.code,
      stage: current.stage,
      estimatedValue: current.estimatedValue,
      itemsCount: current.items.length,
      proposalValidUntil: current.proposalValidUntil,
      customerEventAt: current.customerEventAt,
    }).assertCanEditDetails(input);

    if (input.companyId !== undefined && !(await this.references.companyExists(input.companyId))) {
      throw new OpportunityReferenceInvalidError('A empresa informada não existe.');
    }
    if (input.sellerId !== undefined && !(await this.references.sellerIsActive(input.sellerId))) {
      throw new OpportunityReferenceInvalidError('O vendedor informado não existe ou está inativo.');
    }

    const items = input.items ?? current.items.map(({ productId, quantity }) => ({ productId, quantity }));
    if (input.items !== undefined) await this.validateItems(items);
    const estimatedValue = input.items === undefined
      ? current.estimatedValue
      : await this.calculateEstimatedValue(items);
    const proposalValidUntil = input.proposalValidUntil === undefined ? current.proposalValidUntil : input.proposalValidUntil;
    const customerEventAt = input.customerEventAt === undefined ? current.customerEventAt : input.customerEventAt;
    const lastContactAt = input.lastContactAt === undefined ? current.lastContactAt : input.lastContactAt;
    let nextFollowUpAt = input.nextFollowUpAt === undefined ? current.nextFollowUpAt : input.nextFollowUpAt;
    if (input.lastContactAt !== undefined && input.nextFollowUpAt === undefined && lastContactAt && nextFollowUpAt && nextFollowUpAt <= lastContactAt) {
      nextFollowUpAt = null;
    }
    Opportunity.assertFollowUpDates(
      input.lastContactAt === undefined ? undefined : lastContactAt,
      input.nextFollowUpAt === undefined ? undefined : nextFollowUpAt,
    );
    Opportunity.assertDatesAreNotInPast(
      input.customerEventAt === undefined ? undefined : customerEventAt,
      input.proposalValidUntil === undefined ? undefined : proposalValidUntil,
    );
    Opportunity.assertProposalDeadline(proposalValidUntil, customerEventAt);
    Opportunity.restore({
      id: current.id,
      code: current.code,
      stage: current.stage,
      estimatedValue: current.estimatedValue,
      itemsCount: current.items.length,
      proposalValidUntil: current.proposalValidUntil,
      customerEventAt: current.customerEventAt,
    }).assertCurrentStageInvariants(estimatedValue, items.length, proposalValidUntil, customerEventAt);

    const updated = await this.opportunities.update(id, { ...input, nextFollowUpAt, estimatedValue });
    if (input.lastContactAt !== undefined || input.nextFollowUpAt !== undefined) {
      await this.reminders?.dismissOpenFollowUps(id);
    }
    return updated;
  }

  private async validateItems(items: OpportunityItemInput[]): Promise<void> {
    Opportunity.assertItemsAreUnique(items);
    const productIds = items.map((item) => item.productId);
    const invalidProductIds = await this.references.findInactiveOrMissingProductIds(productIds);
    if (invalidProductIds.length > 0) {
      throw new OpportunityReferenceInvalidError('Um ou mais produtos informados não existem ou estão inativos.');
    }
  }

  private async calculateEstimatedValue(items: OpportunityItemInput[]): Promise<number | null> {
    if (items.length === 0) return null;
    const prices = await this.references.findActiveProductUnitPrices(items.map((item) => item.productId));
    return OpportunityPricingService.calculate(items, prices);
  }

}
