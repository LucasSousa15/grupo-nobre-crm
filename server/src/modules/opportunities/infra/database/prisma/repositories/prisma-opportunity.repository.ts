import { Injectable } from '@nestjs/common';
import { OpportunityStage as PrismaOpportunityStage } from '@prisma/client';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { OpportunityWasChangedError } from 'src/modules/opportunities/application/errors/opportunity-was-changed.error';
import { OpportunitySnapshot } from 'src/modules/opportunities/domain/entities/opportunity.entity';
import { OpportunityRepository, RecordStageTransitionInput } from 'src/modules/opportunities/domain/repositories/opportunity.repository';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';

@Injectable()
export class PrismaOpportunityRepository implements OpportunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OpportunitySnapshot | null> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: { items: { select: { id: true } } },
    });
    if (!opportunity) return null;

    return {
      id: opportunity.id,
      code: opportunity.code,
      stage: opportunity.stage as OpportunityStage,
      estimatedValue: opportunity.estimatedValue?.toNumber() ?? null,
      itemsCount: opportunity.items.length,
    };
  }

  async recordStageTransition(input: RecordStageTransitionInput): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.opportunity.updateMany({
        where: { id: input.opportunityId, stage: input.fromStage as PrismaOpportunityStage },
        data: {
          stage: input.toStage as PrismaOpportunityStage,
          ...(input.toStage === OpportunityStage.LOST ? { lossReason: input.lossReason } : {}),
        },
      });

      if (updated.count !== 1) throw new OpportunityWasChangedError();

      await transaction.stageHistory.create({
        data: {
          opportunityId: input.opportunityId,
          fromStage: input.fromStage as PrismaOpportunityStage,
          toStage: input.toStage as PrismaOpportunityStage,
        },
      });
    });
  }
}
