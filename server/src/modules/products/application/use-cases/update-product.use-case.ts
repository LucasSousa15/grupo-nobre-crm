import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { ProductProps, UpdateProductProps } from '../../domain/types/product';

@Injectable()
export class UpdateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string, input: UpdateProductProps): Promise<ProductProps> {
    const current = await this.products.findById(id);
    if (!current) throw new ResourceNotFoundError('Produto');

    const product = Product.restore(current);
    product.update(input);
    await this.products.save(product.data);
    return product.data;
  }
}
