import { ApplicationError } from 'src/core/shared/errors/application.error';

export class OpportunityReferenceInvalidError extends ApplicationError {
  constructor(message: string) {
    super(message, 422, 'OPPORTUNITY_REFERENCE_INVALID');
  }
}
