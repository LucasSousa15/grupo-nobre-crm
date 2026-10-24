import { Injectable } from '@nestjs/common';
import { Company } from '../../domain/entities/company.entity';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { CompanyProps, CreateCompanyProps } from '../../domain/types/company';

@Injectable()
export class CreateCompanyUseCase {
  constructor(private readonly companies: CompanyRepository) {}

  async execute(input: CreateCompanyProps): Promise<CompanyProps> {
    const company = Company.create(input);
    await this.companies.create(company.data);
    return company.data;
  }
}
