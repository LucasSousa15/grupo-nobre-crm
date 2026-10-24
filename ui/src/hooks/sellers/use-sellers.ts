"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/http/api";
import { sellersResponseSchema } from "@/schemas/seller-schema";

export function useSellers() {
  return useQuery({
    queryKey: ["sellers", "list"],
    queryFn: async ({ signal }) => {
      const response = await crmApi.get("/sellers", { signal });
      return sellersResponseSchema.parse(response.data).sellers.filter((seller) => seller.active);
    },
  });
}
