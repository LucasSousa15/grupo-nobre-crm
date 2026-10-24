import { describe, expect, it } from 'vitest';
import { OpportunityCodeAlreadyUsedError } from 'src/modules/opportunities/application/errors/opportunity-code-already-used.error';
import { OpportunityReferenceInvalidError } from 'src/modules/opportunities/application/errors/opportunity-reference-invalid.error';
import { OpportunityCannotBeDeletedError } from 'src/modules/opportunities/domain/errors/opportunity-cannot-be-deleted.error';
import { OpportunityItemsInvalidError } from 'src/modules/opportunities/domain/errors/opportunity-items-invalid.error';
import { StagePrerequisiteError } from 'src/modules/opportunities/domain/errors/stage-prerequisite.error';
import { CreateOpportunityUseCase } from 'src/modules/opportunities/application/use-cases/create-opportunity.use-case';
import { DeleteOpportunityUseCase } from 'src/modules/opportunities/application/use-cases/delete-opportunity.use-case';
import { FindOpportunitiesUseCase } from 'src/modules/opportunities/application/use-cases/find-opportunities.use-case';
import { UpdateOpportunityUseCase } from 'src/modules/opportunities/application/use-cases/update-opportunity.use-case';
import { OpportunityDetails } from 'src/modules/opportunities/domain/types/opportunity';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';
import { OpportunityAttentionStatus } from 'src/modules/opportunities/domain/services/opportunity-attention.service';
import { InMemoryOpportunityManagementRepository } from '../repositories/in-memory-opportunity-management.repository';

const opportunity = (overrides: Partial<OpportunityDetails> = {}): OpportunityDetails => ({
  id: 'opportunity-id', code: 'OPP-2008', companyId: 'company-id', companyName: 'Tech Alpha', sellerId: 'seller-id', sellerName: 'Ana',
  stage: OpportunityStage.FIRST_CONTACT, estimatedValue: 4500, lastContactAt: null, nextFollowUpAt: null, proposalValidUntil: null,
  customerEventAt: null, lossReason: null, items: [{ id: 'item-id', productId: 'product-id', productName: 'Caneca', quantity: 300 }],
  attentionStatus: OpportunityAttentionStatus.NORMAL,
  createdAt: new Date('2026-10-15T12:00:00.000Z'), updatedAt: new Date('2026-10-15T12:00:00.000Z'), ...overrides,
});

const repositoryWithReferences = (opportunities: OpportunityDetails[] = []) => {
  const repository = new InMemoryOpportunityManagementRepository(opportunities);
  repository.companies.add('company-id');
  repository.activeSellers.add('seller-id');
  repository.activeProducts.add('product-id');
  repository.activeProducts.add('product-2');
  return repository;
};

describe('Opportunity CRUD use cases', () => {
  it('creates an opportunity in First Contact with normalized code and items', async () => {
    const repository = repositoryWithReferences();
    const created = await new CreateOpportunityUseCase(repository, repository).execute({
      code: ' opp-2009 ', companyId: 'company-id', sellerId: 'seller-id', estimatedValue: 1200, items: [{ productId: 'product-id', quantity: 50 }],
    });
    expect(created).toMatchObject({ code: 'OPP-2009', stage: OpportunityStage.FIRST_CONTACT, estimatedValue: 1200 });
    expect(created.items).toHaveLength(1);
  });

  it('does not create duplicate codes or invalid references', async () => {
    const repository = repositoryWithReferences([opportunity()]);
    const create = new CreateOpportunityUseCase(repository, repository);
    await expect(create.execute({ code: 'opp-2008', companyId: 'company-id', sellerId: 'seller-id' })).rejects.toBeInstanceOf(OpportunityCodeAlreadyUsedError);
    await expect(create.execute({ code: 'OPP-2009', companyId: 'missing', sellerId: 'seller-id' })).rejects.toBeInstanceOf(OpportunityReferenceInvalidError);
  });

  it('does not create an opportunity with duplicate or inactive products', async () => {
    const repository = repositoryWithReferences();
    const create = new CreateOpportunityUseCase(repository, repository);
    await expect(create.execute({ code: 'OPP-2009', companyId: 'company-id', sellerId: 'seller-id', items: [{ productId: 'product-id', quantity: 1 }, { productId: 'product-id', quantity: 2 }] })).rejects.toBeInstanceOf(OpportunityItemsInvalidError);
    await expect(create.execute({ code: 'OPP-2010', companyId: 'company-id', sellerId: 'seller-id', items: [{ productId: 'inactive', quantity: 1 }] })).rejects.toBeInstanceOf(OpportunityReferenceInvalidError);
  });

  it('filters opportunities for the Kanban query', async () => {
    const repository = repositoryWithReferences([opportunity(), opportunity({ id: 'other', code: 'OPP-2009', stage: OpportunityStage.FOLLOW_UP, companyName: 'Horizonte' })]);
    const found = await new FindOpportunitiesUseCase(repository).all({ stage: OpportunityStage.FOLLOW_UP, search: 'horiz' });
    expect(found.map((item) => item.id)).toEqual(['other']);
  });

  it('replaces items and preserves quote data invariants after the opportunity advances', async () => {
    const repository = repositoryWithReferences([opportunity({ stage: OpportunityStage.QUOTE_PRESENTATION })]);
    const update = new UpdateOpportunityUseCase(repository, repository);
    const updated = await update.execute('opportunity-id', { items: [{ productId: 'product-2', quantity: 20 }] });
    expect(updated.items).toMatchObject([{ productId: 'product-2', quantity: 20 }]);
    await expect(update.execute('opportunity-id', { estimatedValue: null })).rejects.toBeInstanceOf(StagePrerequisiteError);
  });

  it('deletes only opportunities still in First Contact', async () => {
    const firstContactRepository = repositoryWithReferences([opportunity()]);
    await new DeleteOpportunityUseCase(firstContactRepository).execute('opportunity-id');
    expect(firstContactRepository.opportunities).toHaveLength(0);

    const advancedRepository = repositoryWithReferences([opportunity({ stage: OpportunityStage.FOLLOW_UP })]);
    await expect(new DeleteOpportunityUseCase(advancedRepository).execute('opportunity-id')).rejects.toBeInstanceOf(OpportunityCannotBeDeletedError);
  });
});
