import { ApplicationError } from 'src/core/shared/errors/application.error';

export class OpportunityUpdateEmptyError extends ApplicationError {
  constructor() {
    super('Informe ao menos um campo para atualizar a oportunidade.', 422, 'OPPORTUNITY_UPDATE_EMPTY');
  }
}
