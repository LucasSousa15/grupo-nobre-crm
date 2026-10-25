import { describe, expect, it } from 'vitest';
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
  id: 'opportunity-id', code: 'OPP-2008', companyId: 'company-id', companyName: 'Tech Alpha', companyContactName: 'Mariana', companyContactEmail: 'mariana@techalpha.local', companyContactPhone: '11999990000', sellerId: 'seller-id', sellerName: 'Ana',
  stage: OpportunityStage.FIRST_CONTACT, estimatedValue: 4500, lastContactAt: null, nextFollowUpAt: null, proposalValidUntil: null,
  customerEventAt: new Date('2026-11-30T00:00:00.000Z'), lossReason: null, items: [{ id: 'item-id', productId: 'product-id', productName: 'Caneca', quantity: 300 }],
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
      code: ' opp-2009 ', companyId: 'company-id', sellerId: 'seller-id', estimatedValue: 1200, customerEventAt: new Date('2026-11-30T00:00:00.000Z'), items: [{ productId: 'product-id', quantity: 50 }],
    });
    expect(created).toMatchObject({ code: 'TECH-ALPHA001', stage: OpportunityStage.FIRST_CONTACT, estimatedValue: 50 });
    expect(created.items).toHaveLength(1);
  });

  it('requires an event date when creating an opportunity', async () => {
    const repository = repositoryWithReferences();
    await expect(new CreateOpportunityUseCase(repository, repository).execute({
      code: 'OPP-2011', companyId: 'company-id', sellerId: 'seller-id', customerEventAt: undefined as unknown as Date,
    })).rejects.toMatchObject({ code: 'OPPORTUNITY_EVENT_DATE_REQUIRED' });
  });

  it('does not accept event or proposal dates in the past', async () => {
    const repository = repositoryWithReferences();
    const create = new CreateOpportunityUseCase(repository, repository);

    await expect(create.execute({
      companyId: 'company-id', sellerId: 'seller-id', customerEventAt: new Date('2020-01-01T00:00:00.000Z'),
    })).rejects.toMatchObject({ code: 'OPPORTUNITY_DATE_IN_PAST' });

    await expect(create.execute({
      companyId: 'company-id', sellerId: 'seller-id', customerEventAt: new Date('2099-01-02T00:00:00.000Z'), proposalValidUntil: new Date('2020-01-01T00:00:00.000Z'),
    })).rejects.toMatchObject({ code: 'OPPORTUNITY_DATE_IN_PAST' });
  });

  it('does not accept a proposal that expires before the event deadline', async () => {
    const repository = repositoryWithReferences();
    await expect(new CreateOpportunityUseCase(repository, repository).execute({
      code: 'OPP-2012', companyId: 'company-id', sellerId: 'seller-id',
      customerEventAt: new Date('2026-11-30T00:00:00.000Z'),
      proposalValidUntil: new Date('2026-11-28T00:00:00.000Z'),
    })).rejects.toBeInstanceOf(StagePrerequisiteError);
  });

  it('does not create duplicate codes or invalid references', async () => {
    const repository = repositoryWithReferences([opportunity()]);
    const create = new CreateOpportunityUseCase(repository, repository);
    await expect(create.execute({ companyId: 'company-id', sellerId: 'seller-id', customerEventAt: new Date('2026-11-30T00:00:00.000Z') })).resolves.toMatchObject({ code: 'TECH-ALPHA001' });
    await expect(create.execute({ code: 'OPP-2009', companyId: 'missing', sellerId: 'seller-id', customerEventAt: new Date('2026-11-30T00:00:00.000Z') })).rejects.toBeInstanceOf(OpportunityReferenceInvalidError);
  });

  it('does not create an opportunity with duplicate or inactive products', async () => {
    const repository = repositoryWithReferences();
    const create = new CreateOpportunityUseCase(repository, repository);
    await expect(create.execute({ code: 'OPP-2009', companyId: 'company-id', sellerId: 'seller-id', customerEventAt: new Date('2026-11-30T00:00:00.000Z'), items: [{ productId: 'product-id', quantity: 1 }, { productId: 'product-id', quantity: 2 }] })).rejects.toBeInstanceOf(OpportunityItemsInvalidError);
    await expect(create.execute({ code: 'OPP-2010', companyId: 'company-id', sellerId: 'seller-id', customerEventAt: new Date('2026-11-30T00:00:00.000Z'), items: [{ productId: 'inactive', quantity: 1 }] })).rejects.toBeInstanceOf(OpportunityReferenceInvalidError);
  });

  it('filters opportunities for the Kanban query', async () => {
    const repository = repositoryWithReferences([opportunity(), opportunity({ id: 'other', code: 'OPP-2009', stage: OpportunityStage.FOLLOW_UP, companyName: 'Horizonte' })]);
    const found = await new FindOpportunitiesUseCase(repository).all({ stage: OpportunityStage.FOLLOW_UP, search: 'horiz' });
    expect(found.opportunities.map((item) => item.id)).toEqual(['other']);
  });

  it('paginates the Kanban query with the returned cursor', async () => {
    const repository = repositoryWithReferences([opportunity(), opportunity({ id: 'other', code: 'OPP-2009' })]);
    const useCase = new FindOpportunitiesUseCase(repository);
    const firstPage = await useCase.all({ limit: 1 });
    const secondPage = await useCase.all({ limit: 1, cursor: firstPage.nextCursor ?? undefined });

    expect(firstPage.nextCursor).toBe('opportunity-id');
    expect(secondPage.opportunities.map((item) => item.id)).toEqual(['other']);
  });

  it('returns a newest-first timeline for an existing opportunity', async () => {
    const repository = repositoryWithReferences([opportunity()]);
    repository.history.push(
      { id: 'history-1', opportunityId: 'opportunity-id', fromStage: OpportunityStage.FIRST_CONTACT, toStage: OpportunityStage.QUOTE_PRESENTATION, changedAt: new Date('2026-10-16T10:00:00.000Z') },
      { id: 'history-2', opportunityId: 'opportunity-id', fromStage: OpportunityStage.QUOTE_PRESENTATION, toStage: OpportunityStage.FOLLOW_UP, changedAt: new Date('2026-10-17T10:00:00.000Z') },
    );

    const history = await new FindOpportunitiesUseCase(repository).history('opportunity-id');
    expect(history.map((entry) => entry.id)).toEqual(['history-2', 'history-1']);
  });

  it('replaces items and preserves quote data invariants after the opportunity advances', async () => {
    const repository = repositoryWithReferences([opportunity({
      stage: OpportunityStage.QUOTE_PRESENTATION,
      proposalValidUntil: new Date('2026-11-29T00:00:00.000Z'),
    })]);
    const update = new UpdateOpportunityUseCase(repository, repository);
    const updated = await update.execute('opportunity-id', { items: [{ productId: 'product-2', quantity: 20 }] });
    expect(updated.items).toMatchObject([{ productId: 'product-2', quantity: 20 }]);
    await expect(update.execute('opportunity-id', { estimatedValue: null })).resolves.toMatchObject({ estimatedValue: 20 });
    await expect(update.execute('opportunity-id', { proposalValidUntil: new Date('2026-11-28T00:00:00.000Z') })).rejects.toBeInstanceOf(StagePrerequisiteError);
  });

  it('rejects an update without any field to change', async () => {
    const repository = repositoryWithReferences([opportunity()]);
    const update = new UpdateOpportunityUseCase(repository, repository);

    await expect(update.execute('opportunity-id', {})).rejects.toMatchObject({
      code: 'OPPORTUNITY_UPDATE_EMPTY',
    });
  });

  it('locks commercial details after quote presentation until the opportunity returns to quote review', async () => {
    const repository = repositoryWithReferences([opportunity({
      stage: OpportunityStage.FOLLOW_UP,
      proposalValidUntil: new Date('2026-11-29T00:00:00.000Z'),
    })]);
    const update = new UpdateOpportunityUseCase(repository, repository);

    await expect(update.execute('opportunity-id', {
      items: [{ productId: 'product-2', quantity: 20 }],
    })).rejects.toMatchObject({ code: 'OPPORTUNITY_FIELD_LOCKED' });
  });

  it('clears an obsolete follow-up after a new contact and rejects invalid scheduling dates', async () => {
    const repository = repositoryWithReferences([opportunity({ nextFollowUpAt: new Date('2020-01-01T00:00:00.000Z') })]);
    const update = new UpdateOpportunityUseCase(repository, repository);

    await expect(update.execute('opportunity-id', { lastContactAt: new Date() })).resolves.toMatchObject({ nextFollowUpAt: null });
    await expect(update.execute('opportunity-id', { nextFollowUpAt: new Date('2020-01-01T00:00:00.000Z') }))
      .rejects.toMatchObject({ code: 'INVALID_FOLLOW_UP_DATE' });
  });

  it('deletes only opportunities still in First Contact', async () => {
    const firstContactRepository = repositoryWithReferences([opportunity()]);
    await new DeleteOpportunityUseCase(firstContactRepository).execute('opportunity-id');
    expect(firstContactRepository.opportunities).toHaveLength(0);

    const advancedRepository = repositoryWithReferences([opportunity({ stage: OpportunityStage.FOLLOW_UP })]);
    await expect(new DeleteOpportunityUseCase(advancedRepository).execute('opportunity-id')).rejects.toBeInstanceOf(OpportunityCannotBeDeletedError);
  });
});
