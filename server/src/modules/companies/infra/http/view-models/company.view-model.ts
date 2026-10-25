import { CompanyProps } from 'src/modules/companies/domain/types/company';

export class CompanyViewModel {
  static toHTTP(company: CompanyProps) {
    return {
      id: company.id,
      code: company.code,
      companyName: company.companyName,
      contactName: company.contactName,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
