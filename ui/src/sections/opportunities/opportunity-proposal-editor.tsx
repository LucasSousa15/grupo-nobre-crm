'use client';

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCompanies } from '@/hooks/companies/use-companies';
import { useProducts } from '@/hooks/products/use-products';
import type { Opportunity } from '@/hooks/opportunities/types';
import { crmApi } from '@/http/api';
import { opportunityResponseSchema } from '@/schemas/opportunity-schema';
import { notifyRequestError } from '@/lib/request-feedback';

type ProposalForm = {
  companyId: string;
  customerEventAt: string;
  proposalValidUntil: string;
  items: Array<{ productId: string; quantity: number }>;
};

function civilDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayBefore(dateValue: string): string {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return civilDate(date);
}

const today = civilDate(new Date());

const proposalFormSchema = z.object({
  companyId: z.string().uuid('Selecione uma empresa válida.'),
  customerEventAt: z.string().date('Informe a data do evento.'),
  proposalValidUntil: z.string().date('Informe a validade da proposta.'),
  items: z.array(z.object({
    productId: z.string().uuid('Selecione um brinde válido.'),
    quantity: z.coerce.number().int('A quantidade deve ser inteira.').positive('A quantidade deve ser maior que zero.'),
  })).min(1, 'Inclua ao menos um brinde.'),
}).superRefine((values, context) => {
  if (values.customerEventAt < today) {
    context.addIssue({ code: 'custom', path: ['customerEventAt'], message: 'A data do evento não pode ser anterior a hoje.' });
  }
  if (values.proposalValidUntil < today) {
    context.addIssue({ code: 'custom', path: ['proposalValidUntil'], message: 'A validade da proposta não pode ser anterior a hoje.' });
  }
  if (values.proposalValidUntil < dayBefore(values.customerEventAt)) {
    context.addIssue({ code: 'custom', path: ['proposalValidUntil'], message: 'A proposta deve ser válida até pelo menos a véspera do evento.' });
  }
  const productIds = values.items.map((item) => item.productId);
  if (new Set(productIds).size !== productIds.length) {
    context.addIssue({ code: 'custom', path: ['items'], message: 'Não repita o mesmo brinde na proposta.' });
  }
});

function setSchemaErrors(form: ReturnType<typeof useForm<ProposalForm>>, error: z.ZodError): void {
  for (const issue of error.issues) {
    const [group, index, field] = issue.path;
    if (group === 'companyId' || group === 'customerEventAt' || group === 'proposalValidUntil') {
      form.setError(group, { message: issue.message });
    }
    if (group === 'items' && typeof index === 'number' && (field === 'productId' || field === 'quantity')) {
      form.setError(`items.${index}.${field}`, { message: issue.message });
    }
    if (group === 'items' && field === undefined) {
      form.setError('items', { message: issue.message });
    }
  }
}

export function OpportunityProposalEditor({ opportunity, onCancel, onSaved }: {
  opportunity: Opportunity;
  onCancel: () => void;
  onSaved: (opportunity: Opportunity) => void;
}) {
  const companies = useCompanies();
  const products = useProducts();
  const queryClient = useQueryClient();
  const canChangeCompany = opportunity.stage === 'FIRST_CONTACT';
  const canEditProposal = opportunity.stage === 'FIRST_CONTACT' || opportunity.stage === 'QUOTE_PRESENTATION';
  const form = useForm<ProposalForm>({
    defaultValues: {
      companyId: opportunity.company.id,
      customerEventAt: opportunity.customerEventAt.slice(0, 10),
      proposalValidUntil: opportunity.proposalValidUntil?.slice(0, 10) ?? '',
      items: opportunity.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const customerEventAt = useWatch({ control: form.control, name: 'customerEventAt' });
  const items = useWatch({ control: form.control, name: 'items' }) ?? [];
  const proposalMinimum = customerEventAt && dayBefore(customerEventAt) > today
    ? dayBefore(customerEventAt)
    : today;
  const total = items.reduce(
    (sum, item) => sum + (products.data?.find((product) => product.id === item.productId)?.unitPrice ?? 0) * Number(item.quantity || 0),
    0,
  );

  const save = useMutation({
    mutationFn: async (payload: z.output<typeof proposalFormSchema>) => {
      const { data } = await crmApi.patch(`/opportunities/${opportunity.id}`, {
        ...(canChangeCompany ? { companyId: payload.companyId } : {}),
        customerEventAt: payload.customerEventAt,
        proposalValidUntil: payload.proposalValidUntil,
        items: payload.items,
      });
      return opportunityResponseSchema.parse(data).opportunity;
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Detalhes da proposta atualizados.');
      onSaved(updated);
    },
    onError: (error) => notifyRequestError(error, 'Não foi possível salvar os detalhes da proposta.'),
  });

  function submit(values: ProposalForm): void {
    form.clearErrors();
    const result = proposalFormSchema.safeParse(values);
    if (!result.success) {
      setSchemaErrors(form, result.error);
      toast.error('Revise os campos destacados antes de salvar.');
      return;
    }
    save.mutate(result.data);
  }

  if (!canEditProposal) {
    return <p className="mt-3 rounded-lg border border-nobre-crown/70 bg-nobre-crown/20 p-3 text-sm text-nobre-pitch">Para revisar itens, data do evento ou validade, retorne a oportunidade para Apresentação de Orçamento.</p>;
  }

  return <form noValidate onSubmit={form.handleSubmit(submit)} className="mt-4 space-y-4 rounded-xl border border-nobre-forest/20 bg-nobre-paper-shade p-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">Empresa
        <select {...form.register('companyId')} disabled={!canChangeCompany} aria-invalid={Boolean(form.formState.errors.companyId)} className="cursor-pointer rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 disabled:cursor-not-allowed disabled:bg-nobre-paper-shade aria-[invalid=true]:border-red-600">
          {companies.data?.map((company) => <option key={company.id} value={company.id}>{company.companyName}</option>)}
        </select>
        {form.formState.errors.companyId && <span className="text-xs text-red-700">{form.formState.errors.companyId.message}</span>}
        {!canChangeCompany && <span className="text-xs font-normal text-nobre-ink-soft">A empresa só pode ser alterada em Primeiro Contato.</span>}
      </label>
      <label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">Data do evento
        <input type="date" min={today} {...form.register('customerEventAt')} aria-invalid={Boolean(form.formState.errors.customerEventAt)} className="rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 aria-[invalid=true]:border-red-600" />
        {form.formState.errors.customerEventAt && <span className="text-xs text-red-700">{form.formState.errors.customerEventAt.message}</span>}
      </label>
      <label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">Validade da proposta
        <input type="date" min={proposalMinimum} {...form.register('proposalValidUntil')} aria-invalid={Boolean(form.formState.errors.proposalValidUntil)} className="rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 aria-[invalid=true]:border-red-600" />
        {form.formState.errors.proposalValidUntil && <span className="text-xs text-red-700">{form.formState.errors.proposalValidUntil.message}</span>}
      </label>
      <label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">Valor total calculado
        <input disabled value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)} className="rounded-lg border border-nobre-forest/20 bg-nobre-paper-shade px-3 py-2" />
      </label>
    </div>

    <div>
      <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold text-nobre-forest-deep">Itens da proposta</h4><button type="button" onClick={() => append({ productId: '', quantity: 1 })} className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-nobre-forest hover:text-nobre-forest-deep"><Plus size={15} aria-hidden />Adicionar brinde</button></div>
      {fields.map((field, index) => <div key={field.id} className="mt-2 grid grid-cols-[1fr_5rem_auto] gap-2">
        <div><select {...form.register(`items.${index}.productId`)} aria-invalid={Boolean(form.formState.errors.items?.[index]?.productId)} className="w-full cursor-pointer rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 aria-[invalid=true]:border-red-600"><option value="">Selecione um brinde</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>{form.formState.errors.items?.[index]?.productId && <span className="text-xs text-red-700">{form.formState.errors.items[index]?.productId?.message}</span>}</div>
        <div><input type="number" min="1" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} aria-label="Quantidade" aria-invalid={Boolean(form.formState.errors.items?.[index]?.quantity)} className="w-full rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 aria-[invalid=true]:border-red-600" />{form.formState.errors.items?.[index]?.quantity && <span className="text-xs text-red-700">{form.formState.errors.items[index]?.quantity?.message}</span>}</div>
        <button type="button" aria-label="Remover brinde" disabled={fields.length === 1} onClick={() => remove(index)} className="cursor-pointer rounded-md p-2 text-nobre-pitch transition-colors hover:bg-nobre-pitch hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={16} aria-hidden /></button>
      </div>)}
      {form.formState.errors.items?.message && <span className="mt-1 block text-xs text-red-700">{form.formState.errors.items.message}</span>}
    </div>

    <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-nobre-forest hover:bg-nobre-moss"><X size={16} aria-hidden />Cancelar</button><button disabled={save.isPending} className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-nobre-forest-deep px-4 py-2 text-sm font-semibold text-white hover:bg-nobre-forest disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} aria-hidden />{save.isPending ? 'Salvando...' : 'Salvar proposta'}</button></div>
  </form>;
}
