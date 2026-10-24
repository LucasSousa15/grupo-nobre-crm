import { OpportunityManagementRepository } from 'src/modules/opportunities/domain/repositories/opportunity-management.repository';
import { OpportunityReferencesRepository } from 'src/modules/opportunities/domain/repositories/opportunity-references.repository';
import { CreateOpportunityProps, FindOpportunitiesFilters, OpportunityDetails, UpdateOpportunityProps } from 'src/modules/opportunities/domain/types/opportunity';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';
import { OpportunityAttentionStatus } from 'src/modules/opportunities/domain/services/opportunity-attention.service';

export class InMemoryOpportunityManagementRepository implements OpportunityManagementRepository, OpportunityReferencesRepository {
  readonly companies = new Set<string>();
  readonly activeSellers = new Set<string>();
  readonly activeProducts = new Set<string>();
  constructor(readonly opportunities: OpportunityDetails[] = []) {}

  async findDetailsById(id: string): Promise<OpportunityDetails | null> {
    return this.opportunities.find((opportunity) => opportunity.id === id) ?? null;
  }

  async findByCode(code: string): Promise<OpportunityDetails | null> {
    return this.opportunities.find((opportunity) => opportunity.code === code) ?? null;
  }

  async findMany(filters: FindOpportunitiesFilters): Promise<OpportunityDetails[]> {
    return this.opportunities.filter((opportunity) => (
      (!filters.stage || opportunity.stage === filters.stage)
      && (!filters.sellerId || opportunity.sellerId === filters.sellerId)
      && (!filters.companyId || opportunity.companyId === filters.companyId)
      && (!filters.attentionStatus || opportunity.attentionStatus === filters.attentionStatus)
      && (!filters.search || `${opportunity.code} ${opportunity.companyName}`.toLowerCase().includes(filters.search.toLowerCase()))
    ));
  }

  async create(data: CreateOpportunityProps): Promise<OpportunityDetails> {
    const now = new Date();
    const opportunity: OpportunityDetails = {
      id: crypto.randomUUID(),
      code: data.code,
      companyId: data.companyId,
      companyName: data.companyId,
      companyContactName: data.companyId,
      companyContactEmail: null,
      companyContactPhone: null,
      sellerId: data.sellerId,
      sellerName: data.sellerId,
      stage: OpportunityStage.FIRST_CONTACT,
      estimatedValue: data.estimatedValue ?? null,
      lastContactAt: data.lastContactAt ?? null,
      nextFollowUpAt: data.nextFollowUpAt ?? null,
      proposalValidUntil: data.proposalValidUntil ?? null,
      customerEventAt: data.customerEventAt,
      lossReason: null,
      attentionStatus: OpportunityAttentionStatus.NORMAL,
      items: (data.items ?? []).map((item) => ({ id: crypto.randomUUID(), productId: item.productId, productName: item.productId, quantity: item.quantity })),
      createdAt: now,
      updatedAt: now,
    };
    this.opportunities.push(opportunity);
    return opportunity;
  }

  async update(id: string, data: UpdateOpportunityProps): Promise<OpportunityDetails> {
    const opportunity = (await this.findDetailsById(id))!;
    if (data.companyId !== undefined) opportunity.companyId = data.companyId;
    if (data.sellerId !== undefined) opportunity.sellerId = data.sellerId;
    if (data.estimatedValue !== undefined) opportunity.estimatedValue = data.estimatedValue;
    if (data.lastContactAt !== undefined) opportunity.lastContactAt = data.lastContactAt;
    if (data.nextFollowUpAt !== undefined) opportunity.nextFollowUpAt = data.nextFollowUpAt;
    if (data.proposalValidUntil !== undefined) opportunity.proposalValidUntil = data.proposalValidUntil;
    if (data.customerEventAt !== undefined) opportunity.customerEventAt = data.customerEventAt;
    if (data.items !== undefined) opportunity.items = data.items.map((item) => ({ id: crypto.randomUUID(), productId: item.productId, productName: item.productId, quantity: item.quantity }));
    opportunity.updatedAt = new Date();
    return opportunity;
  }

  async delete(id: string): Promise<void> {
    const index = this.opportunities.findIndex((opportunity) => opportunity.id === id);
    this.opportunities.splice(index, 1);
  }

  async companyExists(id: string): Promise<boolean> { return this.companies.has(id); }
  async sellerIsActive(id: string): Promise<boolean> { return this.activeSellers.has(id); }
  async findInactiveOrMissingProductIds(ids: string[]): Promise<string[]> { return ids.filter((id) => !this.activeProducts.has(id)); }
}
