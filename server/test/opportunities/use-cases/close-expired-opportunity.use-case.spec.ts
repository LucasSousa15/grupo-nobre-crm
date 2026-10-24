import { describe, expect, it } from "vitest";
import {
  DELIVERY_DEADLINE_ELAPSED_LOSS_REASON,
  CloseExpiredOpportunityUseCase,
} from "src/modules/opportunities/application/use-cases/close-expired-opportunity.use-case";
import { OpportunitySnapshot } from "src/modules/opportunities/domain/entities/opportunity.entity";
import { OpportunityStage } from "src/modules/opportunities/domain/types/opportunity-stage";
import { InMemoryOpportunityRepository } from "../repositories/in-memory-opportunity.repository";

const opportunity = (
  overrides: Partial<OpportunitySnapshot> = {},
): OpportunitySnapshot => ({
  id: "opportunity-id",
  code: "OPP-2001",
  stage: OpportunityStage.FOLLOW_UP,
  estimatedValue: 4500,
  itemsCount: 1,
  proposalValidUntil: new Date("2026-10-14T00:00:00.000Z"),
  customerEventAt: new Date("2026-10-15T00:00:00.000Z"),
  ...overrides,
});

describe("CloseExpiredOpportunityUseCase", () => {
  it("moves an open opportunity to lost on the day after its delivery cutoff and records the reason", async () => {
    const repository = new InMemoryOpportunityRepository([opportunity()]);
    const useCase = new CloseExpiredOpportunityUseCase(repository, 3);

    expect(
      await useCase.execute(
        "opportunity-id",
        new Date("2026-10-13T08:00:00.000Z"),
      ),
    ).toBe(true);
    expect(repository.opportunities[0].stage).toBe(OpportunityStage.LOST);
    expect(repository.histories).toEqual([
      expect.objectContaining({
        fromStage: OpportunityStage.FOLLOW_UP,
        toStage: OpportunityStage.LOST,
        lossReason: DELIVERY_DEADLINE_ELAPSED_LOSS_REASON,
      }),
    ]);
  });

  it("keeps the opportunity open through its delivery cutoff and ignores final stages", async () => {
    const repository = new InMemoryOpportunityRepository([
      opportunity({ id: "event-today" }),
      opportunity({ id: "already-lost", stage: OpportunityStage.LOST }),
    ]);
    const useCase = new CloseExpiredOpportunityUseCase(repository, 3);

    expect(
      await useCase.execute(
        "event-today",
        new Date("2026-10-12T23:59:59.000Z"),
      ),
    ).toBe(false);
    expect(
      await useCase.execute(
        "already-lost",
        new Date("2026-10-13T08:00:00.000Z"),
      ),
    ).toBe(false);
    expect(repository.histories).toHaveLength(0);
  });
});
