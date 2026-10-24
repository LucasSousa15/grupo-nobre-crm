import { Injectable } from '@nestjs/common';
import { OpportunityStage as PrismaOpportunityStage, Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { OpportunityWasChangedError } from 'src/modules/opportunities/application/errors/opportunity-was-changed.error';
import { OpportunitySnapshot } from 'src/modules/opportunities/domain/entities/opportunity.entity';
import { OpportunityRepository, RecordStageTransitionInput } from 'src/modules/opportunities/domain/repositories/opportunity.repository';
import { OpportunityManagementRepository } from 'src/modules/opportunities/domain/repositories/opportunity-management.repository';
import { OpportunityReferencesRepository } from 'src/modules/opportunities/domain/repositories/opportunity-references.repository';
import { OpportunityAutomationRepository, OpportunityForAutomation } from 'src/modules/opportunities/domain/repositories/opportunity-automation.repository';
import { CreateOpportunityProps, FindOpportunitiesFilters, OpportunityDetails, UpdateOpportunityProps } from 'src/modules/opportunities/domain/types/opportunity';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';

const opportunityDetailsInclude = {
  company: { select: { companyName: true } },
  seller: { select: { name: true } },
  items: { include: { product: { select: { name: true } } } },
} satisfies Prisma.OpportunityInclude;

type OpportunityWithDetails = Prisma.OpportunityGetPayload<{ include: typeof opportunityDetailsInclude }>;

@Injectable()
export class PrismaOpportunityRepository implements OpportunityRepository, OpportunityManagementRepository, OpportunityReferencesRepository, OpportunityAutomationRepository {
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

  async findDetailsById(id: string): Promise<OpportunityDetails | null> {
    const opportunity = await this.prisma.opportunity.findUnique({ where: { id }, include: opportunityDetailsInclude });
    return opportunity ? this.toDetails(opportunity) : null;
  }

  async findByCode(code: string): Promise<OpportunityDetails | null> {
    const opportunity = await this.prisma.opportunity.findUnique({ where: { code }, include: opportunityDetailsInclude });
    return opportunity ? this.toDetails(opportunity) : null;
  }

  async findMany(filters: FindOpportunitiesFilters): Promise<OpportunityDetails[]> {
    const where: Prisma.OpportunityWhereInput = {
      ...(filters.stage ? { stage: filters.stage as PrismaOpportunityStage } : {}),
      ...(filters.sellerId ? { sellerId: filters.sellerId } : {}),
      ...(filters.companyId ? { companyId: filters.companyId } : {}),
      ...(filters.search?.trim() ? {
        OR: [
          { code: { contains: filters.search.trim(), mode: 'insensitive' } },
          { company: { companyName: { contains: filters.search.trim(), mode: 'insensitive' } } },
        ],
      } : {}),
    };
    const opportunities = await this.prisma.opportunity.findMany({
      where,
      include: opportunityDetailsInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return opportunities.map((opportunity) => this.toDetails(opportunity));
  }

  async create(data: CreateOpportunityProps): Promise<OpportunityDetails> {
    const opportunity = await this.prisma.opportunity.create({
      data: {
        code: data.code,
        companyId: data.companyId,
        sellerId: data.sellerId,
        estimatedValue: data.estimatedValue,
        lastContactAt: data.lastContactAt,
        nextFollowUpAt: data.nextFollowUpAt,
        proposalValidUntil: data.proposalValidUntil,
        customerEventAt: data.customerEventAt,
        items: { create: (data.items ?? []).map((item) => ({ productId: item.productId, quantity: item.quantity })) },
      },
      include: opportunityDetailsInclude,
    });
    return this.toDetails(opportunity);
  }

  async update(id: string, data: UpdateOpportunityProps): Promise<OpportunityDetails> {
    const opportunity = await this.prisma.$transaction(async (transaction) => transaction.opportunity.update({
      where: { id },
      data: {
        ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
        ...(data.sellerId !== undefined ? { sellerId: data.sellerId } : {}),
        ...(data.estimatedValue !== undefined ? { estimatedValue: data.estimatedValue } : {}),
        ...(data.lastContactAt !== undefined ? { lastContactAt: data.lastContactAt } : {}),
        ...(data.nextFollowUpAt !== undefined ? { nextFollowUpAt: data.nextFollowUpAt } : {}),
        ...(data.proposalValidUntil !== undefined ? { proposalValidUntil: data.proposalValidUntil } : {}),
        ...(data.customerEventAt !== undefined ? { customerEventAt: data.customerEventAt } : {}),
        ...(data.items !== undefined ? {
          items: {
            deleteMany: {},
            create: data.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          },
        } : {}),
      },
      include: opportunityDetailsInclude,
    }));
    return this.toDetails(opportunity);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.opportunity.delete({ where: { id } });
  }

  async companyExists(id: string): Promise<boolean> {
    return (await this.prisma.company.count({ where: { id } })) === 1;
  }

  async sellerIsActive(id: string): Promise<boolean> {
    return (await this.prisma.seller.count({ where: { id, active: true } })) === 1;
  }

  async findInactiveOrMissingProductIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const products = await this.prisma.product.findMany({ where: { id: { in: ids }, active: true }, select: { id: true } });
    const validIds = new Set(products.map((product) => product.id));
    return ids.filter((id) => !validIds.has(id));
  }

  async findOpenForAutomation(): Promise<OpportunityForAutomation[]> {
    const opportunities = await this.prisma.opportunity.findMany({
      where: { stage: { notIn: [PrismaOpportunityStage.CLOSED, PrismaOpportunityStage.LOST] } },
      select: {
        id: true,
        code: true,
        stage: true,
        seller: { select: { name: true, email: true, phone: true } },
        lastContactAt: true,
        nextFollowUpAt: true,
        proposalValidUntil: true,
        customerEventAt: true,
      },
    });
    return opportunities.map((opportunity) => ({ ...opportunity, stage: opportunity.stage as OpportunityStage }));
  }

  private toDetails(opportunity: OpportunityWithDetails): OpportunityDetails {
    return {
      id: opportunity.id,
      code: opportunity.code,
      companyId: opportunity.companyId,
      companyName: opportunity.company.companyName,
      sellerId: opportunity.sellerId,
      sellerName: opportunity.seller.name,
      stage: opportunity.stage as OpportunityStage,
      estimatedValue: opportunity.estimatedValue?.toNumber() ?? null,
      lastContactAt: opportunity.lastContactAt,
      nextFollowUpAt: opportunity.nextFollowUpAt,
      proposalValidUntil: opportunity.proposalValidUntil,
      customerEventAt: opportunity.customerEventAt,
      lossReason: opportunity.lossReason,
      items: opportunity.items.map((item) => ({ id: item.id, productId: item.productId, productName: item.product.name, quantity: item.quantity })),
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    };
  }
}
