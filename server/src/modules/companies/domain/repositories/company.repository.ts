import { CompanyProps } from '../types/company';

export abstract class CompanyRepository {
  abstract create(company: CompanyProps): Promise<void>;
  abstract findById(id: string): Promise<CompanyProps | null>;
  abstract findAll(): Promise<CompanyProps[]>;
  abstract save(company: CompanyProps): Promise<void>;
  abstract hasOpportunities(id: string): Promise<boolean>;
  abstract delete(id: string): Promise<void>;
}
