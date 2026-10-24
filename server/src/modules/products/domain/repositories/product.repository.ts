import { ProductProps } from '../types/product';

export abstract class ProductRepository {
  abstract create(product: ProductProps): Promise<void>;
  abstract findById(id: string): Promise<ProductProps | null>;
  abstract findAll(): Promise<ProductProps[]>;
  abstract save(product: ProductProps): Promise<void>;
  abstract hasOpportunityItems(id: string): Promise<boolean>;
  abstract delete(id: string): Promise<void>;
}
