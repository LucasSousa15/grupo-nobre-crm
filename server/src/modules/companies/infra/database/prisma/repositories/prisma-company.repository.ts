import { Injectable } from '@nestjs/common';
import { Company as PrismaCompany } from '@prisma/client';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { CompanyRepository } from 'src/modules/companies/domain/repositories/company.repository';
import { CompanyProps } from 'src/modules/companies/domain/types/company';

@Injectable()
export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(company: CompanyProps): Promise<void> {
    await this.prisma.company.create({ data: company });
  }

  async findById(id: string): Promise<CompanyProps | null> {
    const company = await this.prisma.company.findUnique({ where: { id } });
    return company ? this.toDomain(company) : null;
  }

  async findAll(): Promise<CompanyProps[]> {
    const companies = await this.prisma.company.findMany({ orderBy: { companyName: 'asc' } });
    return companies.map((company) => this.toDomain(company));
  }

  async save(company: CompanyProps): Promise<void> {
    await this.prisma.company.update({
      where: { id: company.id },
      data: {
        companyName: company.companyName,
        contactName: company.contactName,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
      },
    });
  }

  async hasOpportunities(id: string): Promise<boolean> {
    return (await this.prisma.opportunity.count({ where: { companyId: id } })) > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.company.delete({ where: { id } });
  }

  private toDomain(company: PrismaCompany): CompanyProps {
    return {
      id: company.id,
      companyName: company.companyName,
      contactName: company.contactName,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
