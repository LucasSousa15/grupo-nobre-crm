import { ApplicationError } from './application.error';

export class ResourceNotFoundError extends ApplicationError {
  constructor(resource: string) {
    super(`${resource} não encontrado(a).`, 404, 'RESOURCE_NOT_FOUND');
  }
}
