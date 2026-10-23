export enum OpportunityStage {
  FIRST_CONTACT = 'FIRST_CONTACT',
  QUOTE_PRESENTATION = 'QUOTE_PRESENTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  FORECAST = 'FORECAST',
  CLOSED = 'CLOSED',
  LOST = 'LOST',
}

export const FINAL_OPPORTUNITY_STAGES = new Set<OpportunityStage>([
  OpportunityStage.CLOSED,
  OpportunityStage.LOST,
]);
