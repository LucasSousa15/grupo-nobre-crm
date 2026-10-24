import { Module } from '@nestjs/common';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { FindProductUseCase } from './application/use-cases/find-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { ProductRepository } from './domain/repositories/product.repository';
import { PrismaProductRepository } from './infra/database/prisma/repositories/prisma-product.repository';
import { ProductsController } from './infra/http/controllers/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    CreateProductUseCase,
    FindProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    { provide: ProductRepository, useClass: PrismaProductRepository },
  ],
})
export class ProductsModule {}
