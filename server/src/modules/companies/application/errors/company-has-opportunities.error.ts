import { ApplicationError } from 'src/core/shared/errors/application.error';

export class CompanyHasOpportunitiesError extends ApplicationError {
  constructor() {
    super('Não é possível excluir uma empresa com oportunidades vinculadas.', 409, 'COMPANY_HAS_OPPORTUNITIES');
  }
}
