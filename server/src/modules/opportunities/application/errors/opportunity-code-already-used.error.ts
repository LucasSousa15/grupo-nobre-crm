import { ApplicationError } from 'src/core/shared/errors/application.error';

export class OpportunityCodeAlreadyUsedError extends ApplicationError {
  constructor() {
    super('Já existe uma oportunidade cadastrada com este código.', 409, 'OPPORTUNITY_CODE_ALREADY_USED');
  }
}
