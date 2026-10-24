import { Injectable } from '@nestjs/common';
import { Seller as PrismaSeller } from '@prisma/client';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { SellerRepository } from 'src/modules/sellers/domain/repositories/seller.repository';
import { SellerProps } from 'src/modules/sellers/domain/types/seller';

@Injectable()
export class PrismaSellerRepository implements SellerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(seller: SellerProps): Promise<void> {
    await this.prisma.seller.create({ data: seller });
  }

  async findById(id: string): Promise<SellerProps | null> {
    const seller = await this.prisma.seller.findUnique({ where: { id } });
    return seller ? this.toDomain(seller) : null;
  }

  async findByEmail(email: string): Promise<SellerProps | null> {
    const seller = await this.prisma.seller.findUnique({ where: { email } });
    return seller ? this.toDomain(seller) : null;
  }

  async findAll(): Promise<SellerProps[]> {
    const sellers = await this.prisma.seller.findMany({ orderBy: { name: 'asc' } });
    return sellers.map((seller) => this.toDomain(seller));
  }

  async save(seller: SellerProps): Promise<void> {
    await this.prisma.seller.update({
      where: { id: seller.id },
      data: { name: seller.name, email: seller.email, active: seller.active },
    });
  }

  async hasOpportunities(id: string): Promise<boolean> {
    return (await this.prisma.opportunity.count({ where: { sellerId: id } })) > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.seller.delete({ where: { id } });
  }

  private toDomain(seller: PrismaSeller): SellerProps {
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
