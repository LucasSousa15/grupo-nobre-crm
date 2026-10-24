import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { SellerProps } from '../../domain/types/seller';

@Injectable()
export class FindSellerUseCase {
  constructor(private readonly sellers: SellerRepository) {}

  async byId(id: string): Promise<SellerProps> {
    const seller = await this.sellers.findById(id);
    if (!seller) throw new ResourceNotFoundError('Vendedor');
    return seller;
  }

  async all(): Promise<SellerProps[]> {
    return this.sellers.findAll();
  }
}
