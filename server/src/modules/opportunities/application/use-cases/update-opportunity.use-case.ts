import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { OpportunityManagementRepository } from '../../domain/repositories/opportunity-management.repository';
import { OpportunityReferencesRepository } from '../../domain/repositories/opportunity-references.repository';
import { OpportunityItemInput, UpdateOpportunityProps } from '../../domain/types/opportunity';
import { OpportunityStage } from '../../domain/types/opportunity-stage';
import { OpportunityItemsInvalidError } from '../errors/opportunity-items-invalid.error';
import { OpportunityReferenceInvalidError } from '../errors/opportunity-reference-invalid.error';
import { StagePrerequisiteError } from '../errors/stage-prerequisite.error';

@Injectable()
export class UpdateOpportunityUseCase {
  constructor(
    private readonly opportunities: OpportunityManagementRepository,
    private readonly references: OpportunityReferencesRepository,
  ) {}

  async execute(id: string, input: UpdateOpportunityProps) {
    const current = await this.opportunities.findDetailsById(id);
    if (!current) throw new ResourceNotFoundError('Oportunidade');

    if (input.companyId !== undefined && !(await this.references.companyExists(input.companyId))) {
      throw new OpportunityReferenceInvalidError('A empresa informada não existe.');
    }
    if (input.sellerId !== undefined && !(await this.references.sellerIsActive(input.sellerId))) {
      throw new OpportunityReferenceInvalidError('O vendedor informado não existe ou está inativo.');
    }

    const items = input.items ?? current.items.map(({ productId, quantity }) => ({ productId, quantity }));
    if (input.items !== undefined) await this.validateItems(items);
    const estimatedValue = input.estimatedValue === undefined ? current.estimatedValue : input.estimatedValue;
    this.validateStageInvariants(current.stage, estimatedValue, items);

    return this.opportunities.update(id, input);
  }

  private async validateItems(items: OpportunityItemInput[]): Promise<void> {
    const productIds = items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) throw new OpportunityItemsInvalidError();
    const invalidProductIds = await this.references.findInactiveOrMissingProductIds(productIds);
    if (invalidProductIds.length > 0) {
      throw new OpportunityReferenceInvalidError('Um ou mais produtos informados não existem ou estão inativos.');
    }
  }

  private validateStageInvariants(stage: OpportunityStage, estimatedValue: number | null, items: OpportunityItemInput[]): void {
    const stageRequiresQuoteData = [OpportunityStage.QUOTE_PRESENTATION, OpportunityStage.FOLLOW_UP, OpportunityStage.FORECAST, OpportunityStage.CLOSED].includes(stage);
    if (!stageRequiresQuoteData) return;
    if (estimatedValue === null || estimatedValue <= 0) {
      throw new StagePrerequisiteError(stage, 'O valor estimado deve ser maior que zero.');
    }
    if (items.length === 0) {
      throw new StagePrerequisiteError(stage, 'Inclua ao menos um item de brinde.');
    }
  }
}
