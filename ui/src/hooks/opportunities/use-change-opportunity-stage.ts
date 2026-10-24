"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "@/http/api";
import type { OpportunityStage } from "./types";

export interface ChangeOpportunityStageInput {
  opportunityId: string;
  stage: OpportunityStage;
  lossReason?: string;
}

export function useChangeOpportunityStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ opportunityId, stage, lossReason }: ChangeOpportunityStageInput) => {
      await crmApi.patch(`/opportunities/${opportunityId}/stage`, {
        stage,
        ...(lossReason ? { lossReason } : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}
