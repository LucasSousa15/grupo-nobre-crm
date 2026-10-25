import { ApplicationError } from 'src/core/shared/errors/application.error';

export class OpportunityFieldLockedError extends ApplicationError {
  constructor(message: string) {
    super(message, 422, 'OPPORTUNITY_FIELD_LOCKED');
  }
}
