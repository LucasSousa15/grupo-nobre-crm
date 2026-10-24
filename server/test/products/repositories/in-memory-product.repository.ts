import { ProductRepository } from 'src/modules/products/domain/repositories/product.repository';
import { ProductProps } from 'src/modules/products/domain/types/product';

export class InMemoryProductRepository implements ProductRepository {
  readonly opportunityItemProductIds = new Set<string>();
  constructor(readonly products: ProductProps[] = []) {}

  async create(product: ProductProps): Promise<void> {
    this.products.push(product);
  }

  async findById(id: string): Promise<ProductProps | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async findAll(): Promise<ProductProps[]> {
    return [...this.products].sort((first, second) => first.name.localeCompare(second.name));
  }

  async save(product: ProductProps): Promise<void> {
    const index = this.products.findIndex((current) => current.id === product.id);
    this.products[index] = product;
  }

  async hasOpportunityItems(id: string): Promise<boolean> {
    return this.opportunityItemProductIds.has(id);
  }

  async delete(id: string): Promise<void> {
    const index = this.products.findIndex((product) => product.id === id);
    this.products.splice(index, 1);
  }
}
