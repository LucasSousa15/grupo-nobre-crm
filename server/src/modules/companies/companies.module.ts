import { Module } from '@nestjs/common';
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { DeleteCompanyUseCase } from './application/use-cases/delete-company.use-case';
import { FindCompanyUseCase } from './application/use-cases/find-company.use-case';
import { UpdateCompanyUseCase } from './application/use-cases/update-company.use-case';
import { CompanyRepository } from './domain/repositories/company.repository';
import { PrismaCompanyRepository } from './infra/database/prisma/repositories/prisma-company.repository';
import { CompaniesController } from './infra/http/controllers/companies.controller';

@Module({
  controllers: [CompaniesController],
  providers: [
    CreateCompanyUseCase,
    FindCompanyUseCase,
    UpdateCompanyUseCase,
    DeleteCompanyUseCase,
    { provide: CompanyRepository, useClass: PrismaCompanyRepository },
  ],
})
export class CompaniesModule {}
