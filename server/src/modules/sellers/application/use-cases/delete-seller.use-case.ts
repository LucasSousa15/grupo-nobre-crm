import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { SellerHasOpportunitiesError } from '../errors/seller-has-opportunities.error';

@Injectable()
export class DeleteSellerUseCase {
  constructor(private readonly sellers: SellerRepository) {}

  async execute(id: string): Promise<void> {
    if (!(await this.sellers.findById(id))) throw new ResourceNotFoundError('Vendedor');
    if (await this.sellers.hasOpportunities(id)) throw new SellerHasOpportunitiesError();
    await this.sellers.delete(id);
  }
}
