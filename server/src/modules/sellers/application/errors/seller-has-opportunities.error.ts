import { ApplicationError } from 'src/core/shared/errors/application.error';

export class SellerHasOpportunitiesError extends ApplicationError {
  constructor() {
    super('Não é possível excluir um vendedor com oportunidades vinculadas. Desative-o em vez disso.', 409, 'SELLER_HAS_OPPORTUNITIES');
  }
}
