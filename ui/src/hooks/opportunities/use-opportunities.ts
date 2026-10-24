"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/http/api";
import { opportunitiesResponseSchema } from "@/schemas/opportunity-schema";
import type { OpportunityFilters } from "./types";

export function useOpportunities(filters: OpportunityFilters = {}) {
  return useQuery({
    queryKey: ["opportunities", "list", filters],
    // A consulta continua ativa durante as remontagens de desenvolvimento para evitar cancelamentos visíveis na UI.
    queryFn: async () => {
      const response = await crmApi.get("/opportunities", { params: filters });
      return opportunitiesResponseSchema.parse(response.data).opportunities;
    },
  });
}
