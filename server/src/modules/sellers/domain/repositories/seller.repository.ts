import { SellerProps } from '../types/seller';

export abstract class SellerRepository {
  abstract create(seller: SellerProps): Promise<void>;
  abstract findById(id: string): Promise<SellerProps | null>;
  abstract findByEmail(email: string): Promise<SellerProps | null>;
  abstract findAll(): Promise<SellerProps[]>;
  abstract save(seller: SellerProps): Promise<void>;
  abstract hasOpportunities(id: string): Promise<boolean>;
  abstract delete(id: string): Promise<void>;
}
