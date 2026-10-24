import { CompanyRepository } from 'src/modules/companies/domain/repositories/company.repository';
import { CompanyProps } from 'src/modules/companies/domain/types/company';

export class InMemoryCompanyRepository implements CompanyRepository {
  readonly opportunityCompanyIds = new Set<string>();
  constructor(readonly companies: CompanyProps[] = []) {}

  async create(company: CompanyProps): Promise<void> {
    this.companies.push(company);
  }

  async findById(id: string): Promise<CompanyProps | null> {
    return this.companies.find((company) => company.id === id) ?? null;
  }

  async findAll(): Promise<CompanyProps[]> {
    return [...this.companies].sort((first, second) => first.companyName.localeCompare(second.companyName));
  }

  async save(company: CompanyProps): Promise<void> {
    const index = this.companies.findIndex((current) => current.id === company.id);
    this.companies[index] = company;
  }

  async hasOpportunities(id: string): Promise<boolean> {
    return this.opportunityCompanyIds.has(id);
  }

  async delete(id: string): Promise<void> {
    const index = this.companies.findIndex((company) => company.id === id);
    this.companies.splice(index, 1);
  }
}
