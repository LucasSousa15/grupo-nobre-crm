import { ProductProps } from 'src/modules/products/domain/types/product';

export class ProductViewModel {
  static toHTTP(product: ProductProps) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      active: product.active,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
