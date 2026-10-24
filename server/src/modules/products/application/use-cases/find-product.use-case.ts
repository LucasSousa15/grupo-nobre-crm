import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { ProductProps } from '../../domain/types/product';

@Injectable()
export class FindProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async byId(id: string): Promise<ProductProps> {
    const product = await this.products.findById(id);
    if (!product) throw new ResourceNotFoundError('Produto');
    return product;
  }

  async all(): Promise<ProductProps[]> {
    return this.products.findAll();
  }
}
