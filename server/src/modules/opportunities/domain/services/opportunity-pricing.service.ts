import { OpportunityItemInput } from '../types/opportunity';

export class OpportunityPricingService {
  static calculate(items: OpportunityItemInput[], unitPrices: Map<string, string>): number {
    const total = items.reduce((sum, item) => sum + this.toUnits(unitPrices.get(item.productId) ?? '0') * BigInt(item.quantity), 0n);
    const cents = (total + 50n) / 100n;
    return Number(cents) / 100;
  }

  private static toUnits(value: string): bigint {
    const [integer, fraction = ''] = value.split('.');
    return BigInt(integer) * 10_000n + BigInt(fraction.padEnd(4, '0').slice(0, 4));
  }
}
