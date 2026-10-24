import { Injectable } from "@nestjs/common";
import { Opportunity } from "../../domain/entities/opportunity.entity";
import { OpportunityRepository } from "../../domain/repositories/opportunity.repository";
import { OpportunityEventDeadlinePolicy } from "../../domain/services/opportunity-event-deadline-policy.service";
import {
  FINAL_OPPORTUNITY_STAGES,
  OpportunityStage,
} from "../../domain/types/opportunity-stage";
import { env } from "src/core/config/env";

export const DELIVERY_DEADLINE_ELAPSED_LOSS_REASON =
  "Prazo de entrega incompatÃ­vel com a data do evento.";

@Injectable()
export class CloseExpiredOpportunityUseCase {
  constructor(private readonly opportunities: OpportunityRepository) {}

  async execute(
    opportunityId: string,
    now = new Date(),
    deliveryLeadDays = env.eventDeliveryLeadDays,
  ): Promise<boolean> {
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
        deliveryLeadDays,
      )
    ) {
      return false;
    }

    const opportunity = Opportunity.restore(snapshot);
    opportunity.assertCanChangeStage(
      OpportunityStage.LOST,
      DELIVERY_DEADLINE_ELAPSED_LOSS_REASON,
    );
    await this.opportunities.recordStageTransition({
      opportunityId: opportunity.id,
      fromStage: opportunity.stage,
      toStage: OpportunityStage.LOST,
      lossReason: DELIVERY_DEADLINE_ELAPSED_LOSS_REASON,
    });
    return true;
  }
}
