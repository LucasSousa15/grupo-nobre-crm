import { Module } from '@nestjs/common';
import { ChangeOpportunityStageUseCase } from './application/use-cases/change-opportunity-stage.use-case';
import { OpportunityRepository } from './domain/repositories/opportunity.repository';
import { PrismaOpportunityRepository } from './infra/database/prisma/repositories/prisma-opportunity.repository';
import { OpportunitiesController } from './infra/http/controllers/opportunities.controller';

@Module({
  controllers: [OpportunitiesController],
  providers: [
    ChangeOpportunityStageUseCase,
    { provide: OpportunityRepository, useClass: PrismaOpportunityRepository },
  ],
})
export class OpportunitiesModule {}
