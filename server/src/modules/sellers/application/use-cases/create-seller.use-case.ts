import { Injectable } from '@nestjs/common';
import { Seller } from '../../domain/entities/seller.entity';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { CreateSellerProps, SellerProps } from '../../domain/types/seller';
import { SellerEmailAlreadyUsedError } from '../errors/seller-email-already-used.error';

@Injectable()
export class CreateSellerUseCase {
  constructor(private readonly sellers: SellerRepository) {}

  async execute(input: CreateSellerProps): Promise<SellerProps> {
    const email = input.email.trim().toLowerCase();
    if (await this.sellers.findByEmail(email)) throw new SellerEmailAlreadyUsedError();

    const seller = Seller.create({ ...input, email });
    await this.sellers.create(seller.data);
    return seller.data;
  }
}
