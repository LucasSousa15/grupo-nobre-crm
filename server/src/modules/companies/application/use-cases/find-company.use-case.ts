import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { CompanyProps } from '../../domain/types/company';

@Injectable()
export class FindCompanyUseCase {
  constructor(private readonly companies: CompanyRepository) {}

  async byId(id: string): Promise<CompanyProps> {
    const company = await this.companies.findById(id);
    if (!company) throw new ResourceNotFoundError('Empresa');
    return company;
  }

  async all(): Promise<CompanyProps[]> {
    return this.companies.findAll();
  }
}
