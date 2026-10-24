import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { ProductHasOpportunityItemsError } from '../errors/product-has-opportunity-items.error';

@Injectable()
export class DeleteProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string): Promise<void> {
    if (!(await this.products.findById(id))) throw new ResourceNotFoundError('Produto');
    if (await this.products.hasOpportunityItems(id)) throw new ProductHasOpportunityItemsError();
    await this.products.delete(id);
  }
}
