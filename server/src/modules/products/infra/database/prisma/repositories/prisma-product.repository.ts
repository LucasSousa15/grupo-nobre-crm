import { Injectable } from '@nestjs/common';
import { Product as PrismaProduct } from '@prisma/client';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { ProductRepository } from 'src/modules/products/domain/repositories/product.repository';
import { ProductProps } from 'src/modules/products/domain/types/product';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(product: ProductProps): Promise<void> {
    await this.prisma.product.create({ data: product });
  }

  async findById(id: string): Promise<ProductProps | null> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    return product ? this.toDomain(product) : null;
  }

  async findAll(): Promise<ProductProps[]> {
    const products = await this.prisma.product.findMany({ orderBy: { name: 'asc' } });
    return products.map((product) => this.toDomain(product));
  }

  async save(product: ProductProps): Promise<void> {
    await this.prisma.product.update({
      where: { id: product.id },
      data: { name: product.name, description: product.description, active: product.active },
    });
  }

  async hasOpportunityItems(id: string): Promise<boolean> {
    return (await this.prisma.opportunityItem.count({ where: { productId: id } })) > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  private toDomain(product: PrismaProduct): ProductProps {
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
