import { OpportunityStageHistory } from 'src/modules/opportunities/domain/types/opportunity';

export class OpportunityStageHistoryViewModel {
  static toHTTP(history: OpportunityStageHistory) {
    return {
      id: history.id,
      fromStage: history.fromStage,
      toStage: history.toStage,
      changedAt: history.changedAt,
    };
  }
}
