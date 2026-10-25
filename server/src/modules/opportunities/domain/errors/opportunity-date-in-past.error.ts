import { ApplicationError } from 'src/core/shared/errors/application.error';

export class OpportunityDateInPastError extends ApplicationError {
  constructor(field: 'evento' | 'validade da proposta') {
    super(`A data de ${field} não pode ser anterior a hoje.`, 422, 'OPPORTUNITY_DATE_IN_PAST');
  }
}
