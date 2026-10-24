"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/http/api";
import { sellersResponseSchema } from "@/schemas/seller-schema";

export function useSellers() {
  return useQuery({
    queryKey: ["sellers", "list"],
    // Mantemos a requisição em andamento entre as montagens extras do React no modo de desenvolvimento.
    // Isso permite que o React Query reutilize a mesma consulta em vez de abortá-la e executá-la novamente.
    queryFn: async () => {
      const response = await crmApi.get("/sellers");
      return sellersResponseSchema.parse(response.data).sellers.filter((seller) => seller.active);
    },
  });
}
