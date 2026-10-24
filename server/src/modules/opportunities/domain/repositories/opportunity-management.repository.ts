import { CreateOpportunityProps, FindOpportunitiesFilters, OpportunityDetails, OpportunityPage, OpportunityStageHistory, UpdateOpportunityProps } from '../types/opportunity';

export abstract class OpportunityManagementRepository {
  abstract findDetailsById(id: string): Promise<OpportunityDetails | null>;
  abstract findByCode(code: string): Promise<OpportunityDetails | null>;
  abstract findMany(filters: FindOpportunitiesFilters): Promise<OpportunityPage>;
  abstract findStageHistoryByOpportunityId(opportunityId: string): Promise<OpportunityStageHistory[]>;
  abstract create(data: CreateOpportunityProps): Promise<OpportunityDetails>;
  abstract update(id: string, data: UpdateOpportunityProps): Promise<OpportunityDetails>;
  abstract delete(id: string): Promise<void>;
}
