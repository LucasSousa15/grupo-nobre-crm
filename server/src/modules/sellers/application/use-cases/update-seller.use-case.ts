import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { Seller } from '../../domain/entities/seller.entity';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { SellerProps, UpdateSellerProps } from '../../domain/types/seller';
import { SellerEmailAlreadyUsedError } from '../errors/seller-email-already-used.error';

@Injectable()
export class UpdateSellerUseCase {
  constructor(private readonly sellers: SellerRepository) {}

  async execute(id: string, input: UpdateSellerProps): Promise<SellerProps> {
    const current = await this.sellers.findById(id);
    if (!current) throw new ResourceNotFoundError('Vendedor');

    if (input.email !== undefined) {
      const existing = await this.sellers.findByEmail(input.email.trim().toLowerCase());
      if (existing && existing.id !== id) throw new SellerEmailAlreadyUsedError();
    }

    const seller = Seller.restore(current);
    seller.update(input);
    await this.sellers.save(seller.data);
    return seller.data;
  }
}
