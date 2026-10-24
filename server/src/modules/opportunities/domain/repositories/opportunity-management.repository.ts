import { CreateOpportunityProps, FindOpportunitiesFilters, OpportunityDetails, UpdateOpportunityProps } from '../types/opportunity';

export abstract class OpportunityManagementRepository {
  abstract findDetailsById(id: string): Promise<OpportunityDetails | null>;
  abstract findByCode(code: string): Promise<OpportunityDetails | null>;
  abstract findMany(filters: FindOpportunitiesFilters): Promise<OpportunityDetails[]>;
  abstract create(data: CreateOpportunityProps): Promise<OpportunityDetails>;
  abstract update(id: string, data: UpdateOpportunityProps): Promise<OpportunityDetails>;
  abstract delete(id: string): Promise<void>;
}
