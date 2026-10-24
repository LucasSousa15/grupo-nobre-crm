import { SellerProps } from 'src/modules/sellers/domain/types/seller';

export class SellerViewModel {
  static toHTTP(seller: SellerProps) {
    return {
      id: seller.id,
      name: seller.name,
      email: seller.email,
      active: seller.active,
      createdAt: seller.createdAt,
      updatedAt: seller.updatedAt,
    };
  }
}
