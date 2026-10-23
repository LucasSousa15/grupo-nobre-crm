import { ApplicationError } from 'src/core/shared/errors/application.error';
import { OpportunityStage } from '../../domain/types/opportunity-stage';

export class InvalidStageTransitionError extends ApplicationError {
  constructor(fromStage: OpportunityStage, toStage: OpportunityStage, reason?: string) {
    super(reason ?? `Não é permitido mover de ${fromStage} para ${toStage}.`, 422, 'INVALID_STAGE_TRANSITION');
  }
}
