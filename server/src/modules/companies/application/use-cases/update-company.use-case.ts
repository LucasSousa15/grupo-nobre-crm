import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { Company } from '../../domain/entities/company.entity';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { CompanyProps, UpdateCompanyProps } from '../../domain/types/company';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(private readonly companies: CompanyRepository) {}

  async execute(id: string, input: UpdateCompanyProps): Promise<CompanyProps> {
    const current = await this.companies.findById(id);
    if (!current) throw new ResourceNotFoundError('Empresa');

    const company = Company.restore(current);
    company.update(input);
    await this.companies.save(company.data);
    return company.data;
  }
}
