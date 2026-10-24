import { describe, expect, it } from 'vitest';
import { ChangeOpportunityStageUseCase } from 'src/modules/opportunities/application/use-cases/change-opportunity-stage.use-case';
import { InvalidStageTransitionError } from 'src/modules/opportunities/domain/errors/invalid-stage-transition.error';
import { StagePrerequisiteError } from 'src/modules/opportunities/domain/errors/stage-prerequisite.error';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';
import { InMemoryOpportunityRepository } from '../repositories/in-memory-opportunity.repository';

const baseOpportunity = (overrides: Partial<{ stage: OpportunityStage; estimatedValue: number | null; itemsCount: number; proposalValidUntil: Date | null; customerEventAt: Date | null }> = {}) => ({
  id: 'opportunity-id',
  code: 'OPP-2001',
  stage: OpportunityStage.FIRST_CONTACT,
  estimatedValue: 4500,
  itemsCount: 1,
  proposalValidUntil: new Date('2026-11-29T00:00:00.000Z'),
  customerEventAt: new Date('2026-11-30T00:00:00.000Z'),
  ...overrides,
});

describe('ChangeOpportunityStageUseCase', () => {
  it('moves from forecast to closed and writes immutable history', async () => {
    const repository = new InMemoryOpportunityRepository([baseOpportunity({ stage: OpportunityStage.FORECAST })]);
    const useCase = new ChangeOpportunityStageUseCase(repository);

    await useCase.execute({ opportunityId: 'opportunity-id', stage: OpportunityStage.CLOSED });

    expect(repository.opportunities[0].stage).toBe(OpportunityStage.CLOSED);
    expect(repository.histories).toHaveLength(1);
    expect(repository.histories[0]).toMatchObject({ fromStage: OpportunityStage.FORECAST, toStage: OpportunityStage.CLOSED });
  });

  it('does not allow quote presentation without estimated value', async () => {
    const useCase = new ChangeOpportunityStageUseCase(new InMemoryOpportunityRepository([baseOpportunity({ estimatedValue: null })]));
    await expect(useCase.execute({ opportunityId: 'opportunity-id', stage: OpportunityStage.QUOTE_PRESENTATION })).rejects.toBeInstanceOf(StagePrerequisiteError);
  });

  it('does not allow quote presentation without an item', async () => {
    const useCase = new ChangeOpportunityStageUseCase(new InMemoryOpportunityRepository([baseOpportunity({ itemsCount: 0 })]));
    await expect(useCase.execute({ opportunityId: 'opportunity-id', stage: OpportunityStage.QUOTE_PRESENTATION })).rejects.toBeInstanceOf(StagePrerequisiteError);
  });

  it('requires proposal validity through the eve of the event', async () => {
    const useCase = new ChangeOpportunityStageUseCase(new InMemoryOpportunityRepository([
      baseOpportunity({ proposalValidUntil: new Date('2026-11-28T00:00:00.000Z') }),
    ]));
    await expect(useCase.execute({ opportunityId: 'opportunity-id', stage: OpportunityStage.QUOTE_PRESENTATION })).rejects.toBeInstanceOf(StagePrerequisiteError);
  });

  it('does not allow a direct transition from follow-up to closed', async () => {
    const useCase = new ChangeOpportunityStageUseCase(new InMemoryOpportunityRepository([baseOpportunity({ stage: OpportunityStage.FOLLOW_UP })]));
    await expect(useCase.execute({ opportunityId: 'opportunity-id', stage: OpportunityStage.CLOSED })).rejects.toBeInstanceOf(InvalidStageTransitionError);
  });

  it('requires a reason to mark an active opportunity as lost', async () => {
    const useCase = new ChangeOpportunityStageUseCase(new InMemoryOpportunityRepository([baseOpportunity()]));
    await expect(useCase.execute({ opportunityId: 'opportunity-id', stage: OpportunityStage.LOST })).rejects.toBeInstanceOf(StagePrerequisiteError);
  });

  it('allows the two documented commercial returns', async () => {
    const followUpRepository = new InMemoryOpportunityRepository([baseOpportunity({ stage: OpportunityStage.FOLLOW_UP })]);
    await new ChangeOpportunityStageUseCase(followUpRepository).execute({ opportunityId: 'opportunity-id', stage: OpportunityStage.QUOTE_PRESENTATION });
    expect(followUpRepository.opportunities[0].stage).toBe(OpportunityStage.QUOTE_PRESENTATION);

    const forecastRepository = new InMemoryOpportunityRepository([baseOpportunity({ stage: OpportunityStage.FORECAST })]);
    await new ChangeOpportunityStageUseCase(forecastRepository).execute({ opportunityId: 'opportunity-id', stage: OpportunityStage.FOLLOW_UP });
    expect(forecastRepository.opportunities[0].stage).toBe(OpportunityStage.FOLLOW_UP);
  });

  it('does not move a final opportunity', async () => {
    const useCase = new ChangeOpportunityStageUseCase(new InMemoryOpportunityRepository([baseOpportunity({ stage: OpportunityStage.LOST })]));
    await expect(useCase.execute({ opportunityId: 'opportunity-id', stage: OpportunityStage.FOLLOW_UP })).rejects.toBeInstanceOf(InvalidStageTransitionError);
  });
});
