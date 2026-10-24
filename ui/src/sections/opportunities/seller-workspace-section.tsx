"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import type { Seller } from "@/hooks/sellers/types";
import { useSellers } from "@/hooks/sellers/use-sellers";
import { OpportunitiesSection } from "./opportunities-section";

function SellerSelection({ sellers, onSelect }: { sellers: Seller[]; onSelect: (seller: Seller) => void }) {
  return (
    <section>
      <PageHeader
        title="Quem está atendendo?"
        description="Selecione o vendedor para abrir a carteira de oportunidades sob sua responsabilidade."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sellers.map((seller) => (
          <button
            key={seller.id}
            type="button"
            onClick={() => onSelect(seller)}
            className="group rounded-2xl border border-nobre-forest-deep/15 bg-nobre-paper p-5 text-left shadow-sm transition hover:border-nobre-forest hover:bg-nobre-moss hover:shadow-md focus:outline-none focus:ring-2 focus:ring-nobre-sprout"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-nobre-forest-deep text-base font-semibold text-nobre-crown">
              {seller.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="mt-5 block font-semibold text-nobre-forest-deep">{seller.name}</span>
            <span className="mt-1 block text-sm text-nobre-ink-soft">{seller.email}</span>
            <span className="mt-5 inline-flex text-sm font-semibold text-nobre-forest transition group-hover:translate-x-0.5">
              Abrir carteira →
            </span>
          </button>
        ))}
      </div>
      {sellers.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-nobre-forest/25 bg-nobre-paper-shade p-5 text-sm text-nobre-ink-soft">
          Nenhum vendedor ativo está disponível.
        </p>
      )}
    </section>
  );
}

export function SellerWorkspaceSection() {
  const sellersQuery = useSellers();
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  if (selectedSeller) {
    return <OpportunitiesSection seller={selectedSeller} onChangeSeller={() => setSelectedSeller(null)} />;
  }

  if (sellersQuery.isLoading) {
    return <p className="rounded-xl border border-nobre-forest/20 bg-nobre-paper p-5 text-sm text-nobre-ink-soft" role="status">Carregando vendedores...</p>;
  }

  if (sellersQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert">
        <p className="font-semibold">Não foi possível carregar os vendedores.</p>
        <button type="button" onClick={() => void sellersQuery.refetch()} className="mt-3 rounded-md bg-nobre-forest-deep px-3 py-2 text-sm font-medium text-white hover:bg-nobre-forest">
          Tentar novamente
        </button>
      </div>
    );
  }

  return <SellerSelection sellers={sellersQuery.data ?? []} onSelect={setSelectedSeller} />;
}
