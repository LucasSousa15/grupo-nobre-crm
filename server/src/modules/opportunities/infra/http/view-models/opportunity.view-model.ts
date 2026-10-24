import { OpportunityDetails } from 'src/modules/opportunities/domain/types/opportunity';

export class OpportunityViewModel {
  static toHTTP(opportunity: OpportunityDetails) {
    return {
      id: opportunity.id,
      code: opportunity.code,
      stage: opportunity.stage,
      attentionStatus: opportunity.attentionStatus,
      estimatedValue: opportunity.estimatedValue,
      lastContactAt: opportunity.lastContactAt,
      nextFollowUpAt: opportunity.nextFollowUpAt,
      proposalValidUntil: opportunity.proposalValidUntil,
      customerEventAt: opportunity.customerEventAt,
      lossReason: opportunity.lossReason,
      company: {
        id: opportunity.companyId,
        name: opportunity.companyName,
        contactName: opportunity.companyContactName,
        contactEmail: opportunity.companyContactEmail,
        contactPhone: opportunity.companyContactPhone,
      },
      seller: { id: opportunity.sellerId, name: opportunity.sellerName },
      items: opportunity.items.map((item) => ({ id: item.id, productId: item.productId, productName: item.productName, quantity: item.quantity })),
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    };
  }
}
