import { Injectable } from '@nestjs/common';
import { OpportunityStage as PrismaOpportunityStage, Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { OpportunityWasChangedError } from 'src/modules/opportunities/application/errors/opportunity-was-changed.error';
import { OpportunitySnapshot } from 'src/modules/opportunities/domain/entities/opportunity.entity';
import { OpportunityRepository, RecordStageTransitionInput } from 'src/modules/opportunities/domain/repositories/opportunity.repository';
import { OpportunityManagementRepository } from 'src/modules/opportunities/domain/repositories/opportunity-management.repository';
import { OpportunityReferencesRepository } from 'src/modules/opportunities/domain/repositories/opportunity-references.repository';
import { OpportunityAutomationRepository, OpportunityForAutomation } from 'src/modules/opportunities/domain/repositories/opportunity-automation.repository';
import { CreateOpportunityProps, FindOpportunitiesFilters, OpportunityDetails, OpportunityPage, OpportunityStageHistory, UpdateOpportunityProps } from 'src/modules/opportunities/domain/types/opportunity';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';
import { OpportunityAttentionService, OpportunityAttentionStatus } from 'src/modules/opportunities/domain/services/opportunity-attention.service';
import { FOLLOW_UP_DUE_WINDOW_DAYS } from 'src/modules/opportunities/domain/services/follow-up-reminder-policy.service';
import { ReminderType } from 'src/modules/reminders/domain/types/reminder';

const opportunityDetailsInclude = {
  company: { select: { companyName: true, contactName: true, contactEmail: true, contactPhone: true } },
  seller: { select: { name: true } },
  items: { include: { product: { select: { name: true } } } },
  reminders: { select: { type: true, createdAt: true } },
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
      proposalValidUntil: opportunity.proposalValidUntil,
      customerEventAt: opportunity.customerEventAt,
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

  async findMany(filters: FindOpportunitiesFilters): Promise<OpportunityPage> {
    const pageSize = filters.limit ?? 24;
    const rows = await this.findOpportunityPageRows(filters, pageSize);
    const pageRows = rows.slice(0, pageSize);
    const ids = pageRows.map((row) => row.id);
    const resultById = new Map((await this.prisma.opportunity.findMany({
      where: { id: { in: ids } }, include: opportunityDetailsInclude,
    })).map((opportunity) => [opportunity.id, opportunity]));
    const opportunities = ids.map((id) => this.toDetails(resultById.get(id)!));
    const firstRow = rows[0];
    return {
      opportunities,
      nextCursor: rows.length > pageSize ? opportunities.at(-1)?.id ?? null : null,
      total: firstRow ? Number(firstRow.total) : 0,
      attentionSummary: {
        [OpportunityAttentionStatus.NORMAL]: firstRow ? Number(firstRow.normal) : 0,
        [OpportunityAttentionStatus.DUE_SOON]: firstRow ? Number(firstRow.due_soon) : 0,
        [OpportunityAttentionStatus.OVERDUE]: firstRow ? Number(firstRow.overdue) : 0,
        [OpportunityAttentionStatus.CRITICAL]: firstRow ? Number(firstRow.critical) : 0,
      },
    };
  }

  private async findOpportunityPageRows(filters: FindOpportunitiesFilters, pageSize: number) {
    const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
    if (filters.stage) conditions.push(Prisma.sql`o.stage = ${filters.stage}::"OpportunityStage"`);
    if (filters.sellerId) conditions.push(Prisma.sql`o.seller_id = ${filters.sellerId}`);
    if (filters.companyId) conditions.push(Prisma.sql`o.company_id = ${filters.companyId}`);
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(Prisma.sql`(o.code ILIKE ${term} OR EXISTS (SELECT 1 FROM companies c WHERE c.id = o.company_id AND c.company_name ILIKE ${term}))`);
    }
    const baseWhere = Prisma.join(conditions, ' AND ');
    const attentionFilter = filters.attentionStatus ? Prisma.sql`AND f.attention_status = ${filters.attentionStatus}` : Prisma.empty;
    const cursorFilter = filters.cursor ? Prisma.sql`AND (f.updated_at, f.id) < (SELECT updated_at, id FROM scored WHERE id = ${filters.cursor})` : Prisma.empty;
    return this.prisma.$queryRaw<Array<{
      id: string; total: number | bigint; normal: number | bigint; due_soon: number | bigint; overdue: number | bigint; critical: number | bigint;
    }>>(Prisma.sql`
      WITH scored AS (
        SELECT o.id, o.updated_at,
          CASE
            WHEN o.stage IN ('CLOSED'::"OpportunityStage", 'LOST'::"OpportunityStage") THEN 'NORMAL'
            WHEN COUNT(r.id) FILTER (WHERE r.type = 'FOLLOW_UP_OVERDUE'::"ReminderType" AND (o.last_contact_at IS NULL OR r.created_at > o.last_contact_at)) >= 2 THEN 'CRITICAL'
            WHEN COUNT(r.id) FILTER (WHERE r.type = 'FOLLOW_UP_OVERDUE'::"ReminderType" AND (o.last_contact_at IS NULL OR r.created_at > o.last_contact_at)) = 1 THEN 'OVERDUE'
            WHEN o.next_follow_up_at > NOW() AND o.next_follow_up_at <= NOW() + ${FOLLOW_UP_DUE_WINDOW_DAYS} * INTERVAL '1 day' THEN 'DUE_SOON'
            ELSE 'NORMAL'
          END AS attention_status
        FROM opportunities o
        LEFT JOIN reminders r ON r.opportunity_id = o.id
        WHERE ${baseWhere}
        GROUP BY o.id
      ), stats AS (
        SELECT
          COUNT(*) FILTER (WHERE ${filters.attentionStatus ? Prisma.sql`attention_status = ${filters.attentionStatus}` : Prisma.sql`TRUE`}) AS total,
          COUNT(*) FILTER (WHERE attention_status = 'NORMAL') AS normal,
          COUNT(*) FILTER (WHERE attention_status = 'DUE_SOON') AS due_soon,
          COUNT(*) FILTER (WHERE attention_status = 'OVERDUE') AS overdue,
          COUNT(*) FILTER (WHERE attention_status = 'CRITICAL') AS critical
        FROM scored
      )
      SELECT f.id, stats.total, stats.normal, stats.due_soon, stats.overdue, stats.critical
      FROM scored f CROSS JOIN stats
      WHERE TRUE ${attentionFilter} ${cursorFilter}
      ORDER BY f.updated_at DESC, f.id DESC
      LIMIT ${pageSize + 1}
    `);
  }

  async findStageHistoryByOpportunityId(opportunityId: string): Promise<OpportunityStageHistory[]> {
    const history = await this.prisma.stageHistory.findMany({
      where: { opportunityId },
      orderBy: { changedAt: 'desc' },
    });
    return history.map((entry) => ({
      id: entry.id,
      opportunityId: entry.opportunityId,
      fromStage: entry.fromStage as OpportunityStage,
      toStage: entry.toStage as OpportunityStage,
      changedAt: entry.changedAt,
    }));
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

  async findActiveProductUnitPrices(ids: string[]): Promise<Map<string, number>> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, active: true },
      select: { id: true, unitPrice: true },
    });
    return new Map(products.map((product) => [product.id, product.unitPrice.toNumber()]));
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
      companyContactName: opportunity.company.contactName,
      companyContactEmail: opportunity.company.contactEmail,
      companyContactPhone: opportunity.company.contactPhone,
      sellerId: opportunity.sellerId,
      sellerName: opportunity.seller.name,
      stage: opportunity.stage as OpportunityStage,
      estimatedValue: opportunity.estimatedValue?.toNumber() ?? null,
      lastContactAt: opportunity.lastContactAt,
      nextFollowUpAt: opportunity.nextFollowUpAt,
      proposalValidUntil: opportunity.proposalValidUntil,
      customerEventAt: opportunity.customerEventAt,
      lossReason: opportunity.lossReason,
      attentionStatus: OpportunityAttentionService.calculate({
        stage: opportunity.stage as OpportunityStage,
        lastContactAt: opportunity.lastContactAt,
        nextFollowUpAt: opportunity.nextFollowUpAt,
        reminders: opportunity.reminders.map((reminder) => ({
          type: reminder.type as ReminderType,
          createdAt: reminder.createdAt,
        })),
      }),
      items: opportunity.items.map((item) => ({ id: item.id, productId: item.productId, productName: item.product.name, quantity: item.quantity })),
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    };
  }
}
