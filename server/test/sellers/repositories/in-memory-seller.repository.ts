import { SellerRepository } from 'src/modules/sellers/domain/repositories/seller.repository';
import { SellerProps } from 'src/modules/sellers/domain/types/seller';

export class InMemorySellerRepository implements SellerRepository {
  readonly opportunitySellerIds = new Set<string>();
  constructor(readonly sellers: SellerProps[] = []) {}

  async create(seller: SellerProps): Promise<void> {
    this.sellers.push(seller);
  }

  async findById(id: string): Promise<SellerProps | null> {
    return this.sellers.find((seller) => seller.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<SellerProps | null> {
    return this.sellers.find((seller) => seller.email === email) ?? null;
  }

  async findAll(): Promise<SellerProps[]> {
    return [...this.sellers].sort((first, second) => first.name.localeCompare(second.name));
  }

  async save(seller: SellerProps): Promise<void> {
    const index = this.sellers.findIndex((current) => current.id === seller.id);
    this.sellers[index] = seller;
  }

  async hasOpportunities(id: string): Promise<boolean> {
    return this.opportunitySellerIds.has(id);
  }

  async delete(id: string): Promise<void> {
    const index = this.sellers.findIndex((seller) => seller.id === id);
    this.sellers.splice(index, 1);
  }
}
