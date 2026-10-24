"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/http/api";
import { opportunitiesResponseSchema } from "@/schemas/opportunity-schema";
import type { OpportunityFilters } from "./types";

export function useOpportunities(filters: OpportunityFilters = {}) {
  return useQuery({
    queryKey: ["opportunities", "list", filters],
    queryFn: async ({ signal }) => {
      const response = await crmApi.get("/opportunities", { params: filters, signal });
      return opportunitiesResponseSchema.parse(response.data).opportunities;
    },
  });
}
