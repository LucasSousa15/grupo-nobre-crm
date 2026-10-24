"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { crmApi } from "@/http/api";
import { opportunitiesResponseSchema } from "@/schemas/opportunity-schema";
import type { OpportunityFilters } from "./types";

export function useOpportunities(filters: OpportunityFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["opportunities", "list", filters],
    // A consulta continua ativa durante as remontagens de desenvolvimento para evitar cancelamentos visíveis na UI.
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const response = await crmApi.get("/opportunities", { params: { ...filters, cursor: pageParam, limit: 24 } });
      return opportunitiesResponseSchema.parse(response.data);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
