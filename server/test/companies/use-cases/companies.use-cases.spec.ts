import { describe, expect, it } from 'vitest';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { CompanyHasOpportunitiesError } from 'src/modules/companies/application/errors/company-has-opportunities.error';
import { CreateCompanyUseCase } from 'src/modules/companies/application/use-cases/create-company.use-case';
import { DeleteCompanyUseCase } from 'src/modules/companies/application/use-cases/delete-company.use-case';
import { FindCompanyUseCase } from 'src/modules/companies/application/use-cases/find-company.use-case';
import { UpdateCompanyUseCase } from 'src/modules/companies/application/use-cases/update-company.use-case';
import { CompanyProps } from 'src/modules/companies/domain/types/company';
import { InMemoryCompanyRepository } from '../repositories/in-memory-company.repository';

const company = (overrides: Partial<CompanyProps> = {}): CompanyProps => ({
  id: 'company-id',
  companyName: 'Tech Alpha Ltda',
  contactName: 'Mariana Silva',
  contactEmail: 'mariana@techalpha.com.br',
  contactPhone: '+55 11 99999-9999',
  createdAt: new Date('2026-10-15T12:00:00.000Z'),
  updatedAt: new Date('2026-10-15T12:00:00.000Z'),
  ...overrides,
});

describe('Company use cases', () => {
  it('creates a company with one normalized main contact', async () => {
    const repository = new InMemoryCompanyRepository();
    const created = await new CreateCompanyUseCase(repository).execute({
      companyName: ' Tech Alpha Ltda ',
      contactName: ' Mariana Silva ',
      contactEmail: ' MARIANA@TECHALPHA.COM.BR ',
      contactPhone: ' +55 11 99999-9999 ',
    });

    expect(created).toMatchObject({
      companyName: 'Tech Alpha Ltda',
      contactName: 'Mariana Silva',
      contactEmail: 'mariana@techalpha.com.br',
      contactPhone: '+55 11 99999-9999',
    });
  });

  it('lists companies alphabetically', async () => {
    const repository = new InMemoryCompanyRepository([company({ id: 'horizonte', companyName: 'Construtora Horizonte' }), company({ id: 'alpha' })]);
    const companies = await new FindCompanyUseCase(repository).all();
    expect(companies.map((item) => item.companyName)).toEqual(['Construtora Horizonte', 'Tech Alpha Ltda']);
  });

  it('updates company and can clear optional contact fields', async () => {
    const repository = new InMemoryCompanyRepository([company()]);
    const updated = await new UpdateCompanyUseCase(repository).execute('company-id', {
      companyName: 'Tech Alpha Comércio Ltda',
      contactEmail: null,
      contactPhone: null,
    });
    expect(updated).toMatchObject({ companyName: 'Tech Alpha Comércio Ltda', contactEmail: null, contactPhone: null });
  });

  it('does not update a company that does not exist', async () => {
    const useCase = new UpdateCompanyUseCase(new InMemoryCompanyRepository());
    await expect(useCase.execute('missing', { contactName: 'Novo Contato' })).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('does not delete a company with opportunities', async () => {
    const repository = new InMemoryCompanyRepository([company()]);
    repository.opportunityCompanyIds.add('company-id');
    await expect(new DeleteCompanyUseCase(repository).execute('company-id')).rejects.toBeInstanceOf(CompanyHasOpportunitiesError);
  });

  it('deletes a company without opportunities', async () => {
    const repository = new InMemoryCompanyRepository([company()]);
    await new DeleteCompanyUseCase(repository).execute('company-id');
    expect(repository.companies).toHaveLength(0);
  });
});
