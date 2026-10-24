import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { CreateProductProps, ProductProps } from '../../domain/types/product';

@Injectable()
export class CreateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: CreateProductProps): Promise<ProductProps> {
    const product = Product.create(input);
    await this.products.create(product.data);
    return product.data;
  }
}
