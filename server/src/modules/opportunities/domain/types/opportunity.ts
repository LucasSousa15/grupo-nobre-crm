import { OpportunityStage } from './opportunity-stage';
import { OpportunityAttentionStatus } from '../services/opportunity-attention.service';

export interface OpportunityItemInput {
  productId: string;
  quantity: number;
}

export interface OpportunityItemDetails extends OpportunityItemInput {
  id: string;
  productName: string;
}

export interface OpportunityDetails {
  id: string;
  code: string;
  companyId: string;
  companyName: string;
  sellerId: string;
  sellerName: string;
  stage: OpportunityStage;
  estimatedValue: number | null;
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
  proposalValidUntil: Date | null;
  customerEventAt: Date;
  lossReason: string | null;
  attentionStatus: OpportunityAttentionStatus;
  items: OpportunityItemDetails[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOpportunityProps {
  code: string;
  companyId: string;
  sellerId: string;
  estimatedValue?: number;
  lastContactAt?: Date;
  nextFollowUpAt?: Date;
  proposalValidUntil?: Date;
  customerEventAt: Date;
  items?: OpportunityItemInput[];
}

export interface UpdateOpportunityProps {
  companyId?: string;
  sellerId?: string;
  estimatedValue?: number | null;
  lastContactAt?: Date | null;
  nextFollowUpAt?: Date | null;
  proposalValidUntil?: Date | null;
  customerEventAt?: Date;
  items?: OpportunityItemInput[];
}

export interface FindOpportunitiesFilters {
  stage?: OpportunityStage;
  sellerId?: string;
  companyId?: string;
  attentionStatus?: OpportunityAttentionStatus;
  search?: string;
}
