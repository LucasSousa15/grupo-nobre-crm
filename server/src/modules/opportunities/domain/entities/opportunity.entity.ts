import { OpportunityStage, FINAL_OPPORTUNITY_STAGES } from '../types/opportunity-stage';
import { InvalidStageTransitionError } from '../errors/invalid-stage-transition.error';
import { OpportunityCannotBeDeletedError } from '../errors/opportunity-cannot-be-deleted.error';
import { OpportunityItemsInvalidError } from '../errors/opportunity-items-invalid.error';
import { OpportunityEventDateRequiredError } from '../errors/opportunity-event-date-required.error';
import { OpportunityDateInPastError } from '../errors/opportunity-date-in-past.error';
import { OpportunityFieldLockedError } from '../errors/opportunity-field-locked.error';
import { InvalidFollowUpDateError } from '../errors/invalid-follow-up-date.error';
import { StagePrerequisiteError } from '../errors/stage-prerequisite.error';
import { OpportunityItemInput, UpdateOpportunityProps } from '../types/opportunity';

export interface OpportunitySnapshot {
  id: string;
  code: string;
  stage: OpportunityStage;
  estimatedValue: number | null;
  itemsCount: number;
  proposalValidUntil: Date | null;
  customerEventAt: Date | null;
}

export interface OpportunityTransitionOption {
  stage: OpportunityStage;
  enabled: boolean;
  requirements: string[];
  requiresLossReason: boolean;
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
      this.assertQuoteData(toStage, this.props.estimatedValue, this.props.itemsCount, this.props.proposalValidUntil, this.props.customerEventAt);
    }

    if (toStage === OpportunityStage.LOST && !lossReason?.trim()) {
      throw new StagePrerequisiteError('LOST', 'Informe o motivo da perda.');
    }
  }

  assertCanBeDeleted(): void {
    if (this.props.stage !== OpportunityStage.FIRST_CONTACT) throw new OpportunityCannotBeDeletedError();
  }

  assertCanEditDetails(input: UpdateOpportunityProps): void {
    if (FINAL_OPPORTUNITY_STAGES.has(this.props.stage)) {
      throw new OpportunityFieldLockedError('Oportunidades em etapa final não podem ter seus dados comerciais alterados.');
    }

    if (input.companyId !== undefined && this.props.stage !== OpportunityStage.FIRST_CONTACT) {
      throw new OpportunityFieldLockedError('A empresa só pode ser alterada enquanto a oportunidade estiver em Primeiro Contato.');
    }

    const changesProposalDetails = input.items !== undefined
      || input.proposalValidUntil !== undefined
      || input.customerEventAt !== undefined;
    const allowsProposalEdition = this.props.stage === OpportunityStage.FIRST_CONTACT
      || this.props.stage === OpportunityStage.QUOTE_PRESENTATION;

    if (changesProposalDetails && !allowsProposalEdition) {
      throw new OpportunityFieldLockedError('Para revisar a proposta, retorne a oportunidade para Apresentação de Orçamento.');
    }
  }

  transitionOptions(): OpportunityTransitionOption[] {
    return allowedTransitions[this.props.stage].map((stage) => {
      const requirements = stage === OpportunityStage.QUOTE_PRESENTATION
        ? this.quoteRequirements()
        : [];
      return {
        stage,
        enabled: requirements.length === 0,
        requirements,
        requiresLossReason: stage === OpportunityStage.LOST,
      };
    });
  }

  assertCurrentStageInvariants(estimatedValue: number | null, itemsCount: number, proposalValidUntil: Date | null, customerEventAt: Date | null): void {
    const stagesRequiringQuoteData = [
      OpportunityStage.QUOTE_PRESENTATION,
      OpportunityStage.FOLLOW_UP,
      OpportunityStage.FORECAST,
      OpportunityStage.CLOSED,
    ];
    if (stagesRequiringQuoteData.includes(this.props.stage)) {
      this.assertQuoteData(this.props.stage, estimatedValue, itemsCount, proposalValidUntil, customerEventAt);
    }
  }

  static assertItemsAreUnique(items: OpportunityItemInput[]): void {
    const productIds = items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) throw new OpportunityItemsInvalidError();
  }

  static assertEventDateProvided(customerEventAt: Date | null | undefined): asserts customerEventAt is Date {
    if (!customerEventAt) throw new OpportunityEventDateRequiredError();
  }

  static assertDatesAreNotInPast(
    customerEventAt: Date | null | undefined,
    proposalValidUntil: Date | null | undefined,
    referenceDate = new Date(),
  ): void {
    const today = this.startOfUtcDay(referenceDate);
    if (customerEventAt && this.startOfUtcDay(customerEventAt) < today) {
      throw new OpportunityDateInPastError('evento');
    }
    if (proposalValidUntil && this.startOfUtcDay(proposalValidUntil) < today) {
      throw new OpportunityDateInPastError('validade da proposta');
    }
  }

  static assertProposalDeadline(proposalValidUntil: Date | null | undefined, customerEventAt: Date | null | undefined): void {
    if (!proposalValidUntil) return;
    Opportunity.assertEventDateProvided(customerEventAt);
    const eventDeadline = this.addDays(this.startOfUtcDay(customerEventAt), -1);
    if (this.startOfUtcDay(proposalValidUntil) < eventDeadline) {
      throw new StagePrerequisiteError('QUOTE_PRESENTATION', 'A proposta deve ser válida até pelo menos a véspera do evento.');
    }
  }

  static assertFollowUpDates(lastContactAt: Date | null | undefined, nextFollowUpAt: Date | null | undefined, now = new Date()): void {
    if (lastContactAt && lastContactAt > now) {
      throw new InvalidFollowUpDateError('O último contato não pode estar no futuro.');
    }
    if (nextFollowUpAt && nextFollowUpAt <= now) {
      throw new InvalidFollowUpDateError('O próximo follow-up deve ser agendado para o futuro.');
    }
    if (lastContactAt && nextFollowUpAt && nextFollowUpAt <= lastContactAt) {
      throw new InvalidFollowUpDateError('O próximo follow-up deve acontecer após o último contato.');
    }
  }

  private assertQuoteData(stage: OpportunityStage, estimatedValue: number | null, itemsCount: number, proposalValidUntil: Date | null, customerEventAt: Date | null): void {
    Opportunity.assertEventDateProvided(customerEventAt);
    if (estimatedValue === null || estimatedValue <= 0) {
      throw new StagePrerequisiteError(stage, 'Informe um valor estimado maior que zero.');
    }
    if (itemsCount === 0) {
      throw new StagePrerequisiteError(stage, 'Inclua ao menos um item de brinde.');
    }
    if (!proposalValidUntil) {
      throw new StagePrerequisiteError(stage, 'Informe a validade da proposta.');
    }
    Opportunity.assertProposalDeadline(proposalValidUntil, customerEventAt);
  }

  private quoteRequirements(): string[] {
    const requirements: string[] = [];
    if (this.props.estimatedValue === null || this.props.estimatedValue <= 0) {
      requirements.push('Informe um valor estimado maior que zero.');
    }
    if (this.props.itemsCount === 0) {
      requirements.push('Inclua ao menos um item de brinde.');
    }
    if (!this.props.proposalValidUntil) {
      requirements.push('Informe a validade da proposta.');
    } else if (this.props.customerEventAt) {
      const eventDeadline = Opportunity.addDays(Opportunity.startOfUtcDay(this.props.customerEventAt), -1);
      if (Opportunity.startOfUtcDay(this.props.proposalValidUntil) < eventDeadline) {
        requirements.push('A proposta deve ser vÃ¡lida atÃ© pelo menos a vÃ©spera do evento.');
      }
    }
    return requirements;
  }

  private static startOfUtcDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}
