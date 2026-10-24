import { ApplicationError } from 'src/core/shared/errors/application.error';

export class StagePrerequisiteError extends ApplicationError {
  constructor(stage: string, reason: string) {
    super(`Não é possível entrar em ${stage}. ${reason}`, 422, 'STAGE_PREREQUISITE_NOT_MET');
  }
}
