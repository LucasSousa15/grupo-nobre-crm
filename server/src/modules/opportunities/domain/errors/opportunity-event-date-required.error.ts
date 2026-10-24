import { ApplicationError } from 'src/core/shared/errors/application.error';

export class OpportunityEventDateRequiredError extends ApplicationError {
  constructor() {
    super('Informe a data do evento para a oportunidade.', 422, 'OPPORTUNITY_EVENT_DATE_REQUIRED');
  }
}
