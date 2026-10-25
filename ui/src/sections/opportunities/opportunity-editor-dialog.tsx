"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { crmApi } from "@/http/api";
import { useCompanies } from "@/hooks/companies/use-companies";
import { useProducts } from "@/hooks/products/use-products";
import type { Opportunity } from "@/hooks/opportunities/types";
import type { Seller } from "@/hooks/sellers/types";

type Item = { productId: string; quantity: string };

export function OpportunityEditorDialog({
  seller,
  opportunity,
  onClose,
}: {
  seller: Seller;
  opportunity?: Opportunity;
  onClose: () => void;
}) {
  const companies = useCompanies();
  const products = useProducts();
  const client = useQueryClient();
  const [companyId, setCompanyId] = useState(opportunity?.company.id ?? "");
  const [eventAt, setEventAt] = useState(
    opportunity?.customerEventAt.slice(0, 10) ?? "",
  );
  const [items, setItems] = useState<Item[]>(
    opportunity?.items.map((item) => ({
      productId: item.productId,
      quantity: String(item.quantity),
    })) ?? [{ productId: "", quantity: "1" }],
  );
  const company = companies.data?.find((item) => item.id === companyId);
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (products.data?.find((product) => product.id === item.productId)
            ?.unitPrice ?? 0) *
            Number(item.quantity || 0),
        0,
      ),
    [items, products.data],
  );
  const change = (index: number, next: Partial<Item>) =>
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...next } : item,
      ),
    );
  const save = useMutation({
    mutationFn: () => {
      const payload = {
        companyId,
        sellerId: seller.id,
        customerEventAt: eventAt,
        items: items
          .filter((item) => item.productId)
          .map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
          })),
      };
      return opportunity
        ? crmApi.patch(`/opportunities/${opportunity.id}`, payload)
        : crmApi.post("/opportunities", payload);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["opportunities"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-nobre-pitch/50 p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="w-full max-w-xl rounded-2xl bg-nobre-paper p-5 shadow-2xl"
      >
        <header className="flex justify-between">
          <h2 className="text-xl font-semibold">
            {opportunity ? "Editar oportunidade" : "Nova oportunidade"}
          </h2>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            Código
            <input
              disabled
              value={
                opportunity?.code ??
                (company?.code ? `${company.code}001` : "Selecione uma empresa")
              }
              className="mt-1 w-full rounded-lg border bg-nobre-paper-shade p-2"
            />
          </label>
          <label>
            Empresa
            <select
              required
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2"
            >
              <option value="">Selecione</option>
              {companies.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.companyName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Evento
            <input
              required
              type="date"
              value={eventAt}
              onChange={(event) => setEventAt(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2"
            />
          </label>
          <label>
            Valor total
            <input
              disabled
              value={new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
              className="mt-1 w-full rounded-lg border bg-nobre-paper-shade p-2"
            />
          </label>
        </div>
        <section className="mt-5">
          <div className="flex justify-between">
            <h3 className="font-semibold">Brindes</h3>
            <button
              type="button"
              onClick={() =>
                setItems((current) => [
                  ...current,
                  { productId: "", quantity: "1" },
                ])
              }
              className="inline-flex items-center gap-1 text-nobre-forest"
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>
          {items.map((item, index) => (
            <div
              key={index}
              className="mt-2 grid grid-cols-[1fr_5rem_auto] gap-2"
            >
              <select
                required
                value={item.productId}
                onChange={(event) =>
                  change(index, { productId: event.target.value })
                }
                className="rounded-lg border p-2"
              >
                <option value="">Selecione</option>
                {products.data?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) =>
                  change(index, { quantity: event.target.value })
                }
                className="rounded-lg border p-2"
              />
              <button
                type="button"
                aria-label="Remover brinde"
                disabled={items.length === 1}
                onClick={() =>
                  setItems((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                className="cursor-pointer p-2 text-nobre-pitch transition-colors hover:bg-nobre-crown/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </section>
        <button className="mt-6 w-full rounded-lg bg-nobre-forest-deep p-3 font-semibold text-white">
          Salvar oportunidade
        </button>
      </form>
    </div>
  );
}
