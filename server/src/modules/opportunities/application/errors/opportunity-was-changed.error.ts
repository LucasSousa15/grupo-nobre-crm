import { ApplicationError } from 'src/core/shared/errors/application.error';

export class OpportunityWasChangedError extends ApplicationError {
  constructor() {
    super('A oportunidade foi alterada por outra operação. Atualize os dados e tente novamente.', 409, 'OPPORTUNITY_CONCURRENT_MODIFICATION');
  }
}
