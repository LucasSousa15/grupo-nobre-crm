import { ApplicationError } from 'src/core/shared/errors/application.error';

export class ProductHasOpportunityItemsError extends ApplicationError {
  constructor() {
    super('Não é possível excluir um produto já utilizado em oportunidades. Desative-o em vez disso.', 409, 'PRODUCT_HAS_OPPORTUNITY_ITEMS');
  }
}
