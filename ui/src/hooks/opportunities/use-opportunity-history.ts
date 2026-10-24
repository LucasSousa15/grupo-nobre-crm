"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/http/api";
import { opportunityHistoryResponseSchema } from "@/schemas/opportunity-schema";

export function useOpportunityHistory(opportunityId: string) {
  return useQuery({
    queryKey: ["opportunities", "history", opportunityId],
    queryFn: async () => {
      const response = await crmApi.get(`/opportunities/${opportunityId}/history`);
      return opportunityHistoryResponseSchema.parse(response.data).history;
    },
  });
}
