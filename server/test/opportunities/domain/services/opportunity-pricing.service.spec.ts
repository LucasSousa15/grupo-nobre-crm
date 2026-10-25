import { describe, expect, it } from 'vitest';
import { OpportunityPricingService } from 'src/modules/opportunities/domain/services/opportunity-pricing.service';

describe('OpportunityPricingService', () => {
  it('sums decimal unit prices without floating point drift', () => {
    expect(OpportunityPricingService.calculate([
      { productId: 'a', quantity: 3 },
      { productId: 'b', quantity: 2 },
    ], new Map([['a', '0.1000'], ['b', '0.2000']]))).toBe(0.7);
  });
});
