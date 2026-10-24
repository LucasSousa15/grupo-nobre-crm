import { ApplicationError } from 'src/core/shared/errors/application.error';

export class OpportunityCannotBeDeletedError extends ApplicationError {
  constructor() {
    super('Somente oportunidades em Primeiro Contato podem ser excluídas.', 422, 'OPPORTUNITY_CANNOT_BE_DELETED');
  }
}
