import { Module } from '@nestjs/common';
import { CreateSellerUseCase } from './application/use-cases/create-seller.use-case';
import { DeleteSellerUseCase } from './application/use-cases/delete-seller.use-case';
import { FindSellerUseCase } from './application/use-cases/find-seller.use-case';
import { UpdateSellerUseCase } from './application/use-cases/update-seller.use-case';
import { SellerRepository } from './domain/repositories/seller.repository';
import { PrismaSellerRepository } from './infra/database/prisma/repositories/prisma-seller.repository';
import { SellersController } from './infra/http/controllers/sellers.controller';

@Module({
  controllers: [SellersController],
  providers: [
    CreateSellerUseCase,
    FindSellerUseCase,
    UpdateSellerUseCase,
    DeleteSellerUseCase,
    { provide: SellerRepository, useClass: PrismaSellerRepository },
  ],
})
export class SellersModule {}
