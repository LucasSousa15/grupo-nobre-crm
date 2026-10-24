'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import { crmApi } from '@/http/api';
import { toCivilDateInput } from '@/lib/date-format';
import { useCompanies } from '@/hooks/companies/use-companies';
import { useProducts } from '@/hooks/products/use-products';
import type { Opportunity } from '@/hooks/opportunities/types';
import type { Seller } from '@/hooks/sellers/types';

type DraftItem = { productId: string; quantity: string };

export function OpportunityEditorDialog({ seller, opportunity, onClose }: { seller: Seller; opportunity?: Opportunity; onClose: () => void }) {
  const companies = useCompanies();
  const products = useProducts();
  const queryClient = useQueryClient();
  const [code, setCode] = useState(opportunity?.code ?? '');
  const [companyId, setCompanyId] = useState(opportunity?.company.id ?? '');
  const [estimatedValue, setEstimatedValue] = useState(opportunity?.estimatedValue?.toString() ?? '');
  const [eventAt, setEventAt] = useState(toCivilDateInput(opportunity?.customerEventAt ?? null));
  const [proposalValidUntil, setProposalValidUntil] = useState(toCivilDateInput(opportunity?.proposalValidUntil ?? null));
  const [items, setItems] = useState<DraftItem[]>(opportunity?.items.map((item) => ({ productId: item.productId, quantity: String(item.quantity) })) ?? []);
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        companyId,
        sellerId: seller.id,
        estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
        customerEventAt: eventAt,
        proposalValidUntil: proposalValidUntil || undefined,
        items: items.filter((item) => item.productId).map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
      };
      return opportunity
        ? crmApi.patch(`/opportunities/${opportunity.id}`, payload)
        : crmApi.post('/opportunities', { ...payload, code });
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['opportunities'] }); onClose(); },
    onError: (reason: unknown) => { const value = reason as { response?: { data?: { message?: string } } }; setError(value.response?.data?.message ?? 'Não foi possível salvar a oportunidade.'); },
  });
  const changeItem = (index: number, next: Partial<DraftItem>) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item));

  return <div className="fixed inset-0 z-[60] grid place-items-center bg-nobre-pitch/50 p-4" role="presentation"><form onSubmit={(event) => { event.preventDefault(); setError(''); save.mutate(); }} className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-nobre-paper p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="opportunity-editor-title"><div className="flex justify-between gap-3"><div><h2 id="opportunity-editor-title" className="text-xl font-semibold text-nobre-forest-deep">{opportunity ? 'Editar oportunidade' : 'Nova oportunidade'}</h2><p className="text-sm text-nobre-ink-soft">Carteira de {seller.name}</p></div><button type="button" onClick={onClose} className="cursor-pointer"><X aria-label="Fechar" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{!opportunity && <label className="grid gap-1 text-sm">Código<input required value={code} onChange={(event) => setCode(event.target.value)} className="rounded-lg border p-2" /></label>}<label className="grid gap-1 text-sm">Empresa<select required value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="cursor-pointer rounded-lg border p-2"><option value="">Selecione</option>{companies.data?.map((company) => <option key={company.id} value={company.id}>{company.companyName}</option>)}</select></label><label className="grid gap-1 text-sm">Evento<input required type="date" value={eventAt} onChange={(event) => setEventAt(event.target.value)} className="rounded-lg border p-2" /></label><label className="grid gap-1 text-sm">Valor estimado<input type="number" min="0.01" step="0.01" value={estimatedValue} onChange={(event) => setEstimatedValue(event.target.value)} className="rounded-lg border p-2" /></label><label className="grid gap-1 text-sm">Validade da proposta<input type="date" value={proposalValidUntil} onChange={(event) => setProposalValidUntil(event.target.value)} className="rounded-lg border p-2" /></label></div><section className="mt-5"><div className="flex items-center justify-between"><h3 className="font-semibold text-nobre-forest-deep">Brindes</h3><button type="button" onClick={() => setItems((current) => [...current, { productId: '', quantity: '1' }])} className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-nobre-forest"><Plus size={15} aria-hidden />Adicionar brinde</button></div><div className="mt-3 space-y-2">{items.map((item, index) => <div key={`${item.productId}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]"><select value={item.productId} onChange={(event) => changeItem(index, { productId: event.target.value })} className="cursor-pointer rounded-lg border p-2"><option value="">Selecione o brinde</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input aria-label="Quantidade" type="number" min="1" value={item.quantity} onChange={(event) => changeItem(index, { quantity: event.target.value })} className="rounded-lg border p-2" /><button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="cursor-pointer rounded-lg border border-nobre-crown/50 px-3 text-nobre-pitch" aria-label="Remover brinde"><Trash2 size={16} aria-hidden /></button></div>)}{items.length === 0 && <p className="text-sm text-nobre-ink-soft">Nenhum brinde informado ainda.</p>}</div></section>{error && <p role="alert" className="mt-4 text-sm text-nobre-pitch">{error}</p>}<button disabled={save.isPending} className="mt-6 w-full cursor-pointer rounded-lg bg-nobre-forest-deep px-4 py-3 font-semibold text-white disabled:opacity-60">{save.isPending ? 'Salvando...' : 'Salvar oportunidade'}</button></form></div>;
}
