import { ApplicationError } from 'src/core/shared/errors/application.error';

export class OpportunityItemsInvalidError extends ApplicationError {
  constructor(message = 'Os itens da oportunidade não podem conter o mesmo produto mais de uma vez.') {
    super(message, 422, 'OPPORTUNITY_ITEMS_INVALID');
  }
}
