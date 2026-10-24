import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { CompanyHasOpportunitiesError } from '../errors/company-has-opportunities.error';

@Injectable()
export class DeleteCompanyUseCase {
  constructor(private readonly companies: CompanyRepository) {}

  async execute(id: string): Promise<void> {
    if (!(await this.companies.findById(id))) throw new ResourceNotFoundError('Empresa');
    if (await this.companies.hasOpportunities(id)) throw new CompanyHasOpportunitiesError();
    await this.companies.delete(id);
  }
}
