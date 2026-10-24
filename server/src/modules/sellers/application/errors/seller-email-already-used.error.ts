import { ApplicationError } from 'src/core/shared/errors/application.error';

export class SellerEmailAlreadyUsedError extends ApplicationError {
  constructor() {
    super('Já existe um vendedor cadastrado com este e-mail.', 409, 'SELLER_EMAIL_ALREADY_USED');
  }
}
