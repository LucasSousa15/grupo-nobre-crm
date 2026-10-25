export abstract class OpportunityReferencesRepository {
  abstract companyExists(id: string): Promise<boolean>;
  abstract sellerIsActive(id: string): Promise<boolean>;
  abstract findInactiveOrMissingProductIds(ids: string[]): Promise<string[]>;
  abstract findActiveProductUnitPrices(ids: string[]): Promise<Map<string, number>>;
}
