import { ApplicationError } from 'src/core/shared/errors/application.error';

export class InvalidFollowUpDateError extends ApplicationError {
  constructor(message: string) {
    super(message, 422, 'INVALID_FOLLOW_UP_DATE');
  }
}
