import { OpportunityStage, FINAL_OPPORTUNITY_STAGES } from '../types/opportunity-stage';
import { InvalidStageTransitionError } from '../errors/invalid-stage-transition.error';
import { OpportunityCannotBeDeletedError } from '../errors/opportunity-cannot-be-deleted.error';
import { OpportunityItemsInvalidError } from '../errors/opportunity-items-invalid.error';
import { StagePrerequisiteError } from '../errors/stage-prerequisite.error';
import { OpportunityItemInput } from '../types/opportunity';

export interface OpportunitySnapshot {
  id: string;
  code: string;
  stage: OpportunityStage;
  estimatedValue: number | null;
  itemsCount: number;
}

const allowedTransitions: Readonly<Record<OpportunityStage, readonly OpportunityStage[]>> = {
  [OpportunityStage.FIRST_CONTACT]: [OpportunityStage.QUOTE_PRESENTATION, OpportunityStage.LOST],
  [OpportunityStage.QUOTE_PRESENTATION]: [OpportunityStage.FOLLOW_UP, OpportunityStage.LOST],
  [OpportunityStage.FOLLOW_UP]: [OpportunityStage.QUOTE_PRESENTATION, OpportunityStage.FORECAST, OpportunityStage.LOST],
  [OpportunityStage.FORECAST]: [OpportunityStage.FOLLOW_UP, OpportunityStage.CLOSED, OpportunityStage.LOST],
  [OpportunityStage.CLOSED]: [],
  [OpportunityStage.LOST]: [],
};

export class Opportunity {
  private constructor(private readonly props: OpportunitySnapshot) {}

  static restore(props: OpportunitySnapshot): Opportunity {
    return new Opportunity(props);
  }

  get id(): string { return this.props.id; }
  get stage(): OpportunityStage { return this.props.stage; }

  assertCanChangeStage(toStage: OpportunityStage, lossReason?: string): void {
    if (FINAL_OPPORTUNITY_STAGES.has(this.props.stage)) {
      throw new InvalidStageTransitionError(this.props.stage, toStage, 'O estágio atual é final.');
    }

    if (!allowedTransitions[this.props.stage].includes(toStage)) {
      throw new InvalidStageTransitionError(this.props.stage, toStage);
    }

    if (toStage === OpportunityStage.QUOTE_PRESENTATION) {
      this.assertQuoteData(toStage, this.props.estimatedValue, this.props.itemsCount);
    }

    if (toStage === OpportunityStage.LOST && !lossReason?.trim()) {
      throw new StagePrerequisiteError('LOST', 'Informe o motivo da perda.');
    }
  }

  assertCanBeDeleted(): void {
    if (this.props.stage !== OpportunityStage.FIRST_CONTACT) throw new OpportunityCannotBeDeletedError();
  }

  assertCurrentStageInvariants(estimatedValue: number | null, itemsCount: number): void {
    const stagesRequiringQuoteData = [
      OpportunityStage.QUOTE_PRESENTATION,
      OpportunityStage.FOLLOW_UP,
      OpportunityStage.FORECAST,
      OpportunityStage.CLOSED,
    ];
    if (stagesRequiringQuoteData.includes(this.props.stage)) {
      this.assertQuoteData(this.props.stage, estimatedValue, itemsCount);
    }
  }

  static assertItemsAreUnique(items: OpportunityItemInput[]): void {
    const productIds = items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) throw new OpportunityItemsInvalidError();
  }

  private assertQuoteData(stage: OpportunityStage, estimatedValue: number | null, itemsCount: number): void {
    if (estimatedValue === null || estimatedValue <= 0) {
      throw new StagePrerequisiteError(stage, 'Informe um valor estimado maior que zero.');
    }
    if (itemsCount === 0) {
      throw new StagePrerequisiteError(stage, 'Inclua ao menos um item de brinde.');
    }
  }
}
