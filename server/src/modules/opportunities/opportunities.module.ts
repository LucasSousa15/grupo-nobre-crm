import { Module } from "@nestjs/common";
import { ChangeOpportunityStageUseCase } from "./application/use-cases/change-opportunity-stage.use-case";
import { CloseExpiredOpportunityUseCase } from "./application/use-cases/close-expired-opportunity.use-case";
import { CreateOpportunityUseCase } from "./application/use-cases/create-opportunity.use-case";
import { DeleteOpportunityUseCase } from "./application/use-cases/delete-opportunity.use-case";
import { FindOpportunitiesUseCase } from "./application/use-cases/find-opportunities.use-case";
import { UpdateOpportunityUseCase } from "./application/use-cases/update-opportunity.use-case";
import { OpportunityManagementRepository } from "./domain/repositories/opportunity-management.repository";
import { OpportunityAutomationRepository } from "./domain/repositories/opportunity-automation.repository";
import { OpportunityRepository } from "./domain/repositories/opportunity.repository";
import { OpportunityReferencesRepository } from "./domain/repositories/opportunity-references.repository";
import { PrismaOpportunityRepository } from "./infra/database/prisma/repositories/prisma-opportunity.repository";
import { OpportunitiesController } from "./infra/http/controllers/opportunities.controller";

@Module({
  controllers: [OpportunitiesController],
  providers: [
    PrismaOpportunityRepository,
    CreateOpportunityUseCase,
    FindOpportunitiesUseCase,
    UpdateOpportunityUseCase,
    DeleteOpportunityUseCase,
    ChangeOpportunityStageUseCase,
    CloseExpiredOpportunityUseCase,
    {
      provide: OpportunityRepository,
      useExisting: PrismaOpportunityRepository,
    },
    {
      provide: OpportunityManagementRepository,
      useExisting: PrismaOpportunityRepository,
    },
    {
      provide: OpportunityReferencesRepository,
      useExisting: PrismaOpportunityRepository,
    },
    {
      provide: OpportunityAutomationRepository,
      useExisting: PrismaOpportunityRepository,
    },
  ],
  exports: [OpportunityAutomationRepository, CloseExpiredOpportunityUseCase],
})
export class OpportunitiesModule {}
