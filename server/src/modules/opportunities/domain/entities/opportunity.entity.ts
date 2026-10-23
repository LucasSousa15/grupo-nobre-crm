import { OpportunityStage, FINAL_OPPORTUNITY_STAGES } from '../types/opportunity-stage';
import { InvalidStageTransitionError } from '../../application/errors/invalid-stage-transition.error';
import { StagePrerequisiteError } from '../../application/errors/stage-prerequisite.error';

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
      if (this.props.estimatedValue === null || this.props.estimatedValue <= 0) {
        throw new StagePrerequisiteError('QUOTE_PRESENTATION', 'Informe um valor estimado maior que zero.');
      }
      if (this.props.itemsCount === 0) {
        throw new StagePrerequisiteError('QUOTE_PRESENTATION', 'Inclua ao menos um item de brinde.');
      }
    }

    if (toStage === OpportunityStage.LOST && !lossReason?.trim()) {
      throw new StagePrerequisiteError('LOST', 'Informe o motivo da perda.');
    }
  }
}
