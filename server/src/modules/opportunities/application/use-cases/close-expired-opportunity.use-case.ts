import { Injectable } from "@nestjs/common";
import { Opportunity } from "../../domain/entities/opportunity.entity";
import { OpportunityRepository } from "../../domain/repositories/opportunity.repository";
import { OpportunityEventDeadlinePolicy } from "../../domain/services/opportunity-event-deadline-policy.service";
import {
  FINAL_OPPORTUNITY_STAGES,
  OpportunityStage,
} from "../../domain/types/opportunity-stage";

export const EVENT_ELAPSED_LOSS_REASON =
  "Evento realizado sem fechamento da oportunidade.";

@Injectable()
export class CloseExpiredOpportunityUseCase {
  constructor(private readonly opportunities: OpportunityRepository) {}

  async execute(opportunityId: string, now = new Date()): Promise<boolean> {
    const snapshot = await this.opportunities.findById(opportunityId);
    if (
      !snapshot ||
      !snapshot.customerEventAt ||
      FINAL_OPPORTUNITY_STAGES.has(snapshot.stage)
    ) {
      return false;
    }
    if (
      !OpportunityEventDeadlinePolicy.hasElapsed(
        { customerEventAt: snapshot.customerEventAt },
        now,
      )
    ) {
      return false;
    }

    const opportunity = Opportunity.restore(snapshot);
    opportunity.assertCanChangeStage(
      OpportunityStage.LOST,
      EVENT_ELAPSED_LOSS_REASON,
    );
    await this.opportunities.recordStageTransition({
      opportunityId: opportunity.id,
      fromStage: opportunity.stage,
      toStage: OpportunityStage.LOST,
      lossReason: EVENT_ELAPSED_LOSS_REASON,
    });
    return true;
  }
}
