'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { crmApi } from '@/http/api';
import { useCompanies } from '@/hooks/companies/use-companies';
import { useProducts } from '@/hooks/products/use-products';
import type { Opportunity } from '@/hooks/opportunities/types';
import type { Seller } from '@/hooks/sellers/types';
import { notifyRequestError } from '@/lib/request-feedback';

const today = new Date();
const todayAsCivilDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const opportunityFormSchema = z.object({
  companyId: z.string().uuid('Selecione uma empresa válida.'),
  customerEventAt: z.string()
    .date('Informe a data do evento.')
    .refine((value) => value >= todayAsCivilDate, 'A data do evento não pode ser anterior a hoje.'),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Selecione um brinde válido.'),
        quantity: z.coerce
          .number()
          .int('A quantidade deve ser um número inteiro.')
          .positive('A quantidade deve ser maior que zero.'),
      }),
    )
    .min(1, 'Inclua ao menos um brinde.'),
});

type OpportunityForm = {
  companyId: string;
  customerEventAt: string;
  items: Array<{ productId: string; quantity: number }>;
};

type OpportunityEditorDialogProps = {
  seller: Seller;
  opportunity?: Opportunity;
  onClose: () => void;
};

export function OpportunityEditorDialog({
  seller,
  opportunity,
  onClose,
}: OpportunityEditorDialogProps) {
  const companies = useCompanies();
  const products = useProducts();
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>('button, select, input:not(:disabled)')?.focus();
    return () => returnFocusRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled)')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  const form = useForm<OpportunityForm>({
    defaultValues: {
      companyId: opportunity?.company.id ?? '',
      customerEventAt: opportunity?.customerEventAt.slice(0, 10) ?? '',
      items:
        opportunity?.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })) ?? [{ productId: '', quantity: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  const watchedItems = useWatch({ control: form.control, name: 'items' }) ?? [];
  const total = watchedItems.reduce(
    (sum, item) =>
      sum +
      (products.data?.find((product) => product.id === item.productId)?.unitPrice ?? 0) *
        Number(item.quantity || 0),
    0,
  );

  const save = useMutation({
    mutationFn: (payload: z.output<typeof opportunityFormSchema>) => {
      const requestBody = { ...payload, sellerId: seller.id };
      return opportunity
        ? crmApi.patch(`/opportunities/${opportunity.id}`, requestBody)
        : crmApi.post('/opportunities', requestBody);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success(opportunity ? 'Oportunidade atualizada com sucesso.' : 'Oportunidade criada com sucesso.');
      onClose();
    },
    onError: (error) => notifyRequestError(error, 'Não foi possível salvar a oportunidade. Tente novamente.'),
  });

  function submit(values: OpportunityForm) {
    form.clearErrors();
    const result = opportunityFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path;
        if (path[0] === 'companyId') form.setError('companyId', { message: issue.message });
        if (path[0] === 'customerEventAt') form.setError('customerEventAt', { message: issue.message });
        if (path[0] === 'items' && typeof path[1] === 'number') {
          const field = path[2];
          if (field === 'productId' || field === 'quantity') {
            form.setError(`items.${path[1]}.${field}`, { message: issue.message });
          }
        }
      }
      toast.error('Revise os campos destacados antes de salvar.');
      return;
    }
    save.mutate(result.data);
  }

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="opportunity-editor-title" onKeyDown={handleKeyDown} className="fixed inset-0 z-[60] grid place-items-center bg-nobre-pitch/50 p-4">
      <form noValidate onSubmit={form.handleSubmit(submit)} className="w-full max-w-xl rounded-2xl bg-nobre-paper p-5 shadow-2xl">
        <header className="flex justify-between">
          <h2 id="opportunity-editor-title" className="text-xl font-semibold">{opportunity ? 'Editar oportunidade' : 'Nova oportunidade'}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="cursor-pointer rounded-md p-1 hover:bg-nobre-paper-shade"><X /></button>
        </header>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>Código<input disabled value={opportunity?.code ?? 'Será gerado automaticamente (OPP-0000)'} className="mt-1 w-full rounded-lg border bg-nobre-paper-shade p-2" /></label>
          <label>Empresa
            <select {...form.register('companyId')} aria-invalid={Boolean(form.formState.errors.companyId)} className="mt-1 w-full cursor-pointer rounded-lg border p-2 aria-[invalid=true]:border-red-600">
              <option value="">Selecione</option>
              {companies.data?.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}
            </select>
            {form.formState.errors.companyId && <span className="mt-1 block text-sm text-red-700">{form.formState.errors.companyId.message}</span>}
          </label>
          <label>Evento
            <input type="date" min={todayAsCivilDate} {...form.register('customerEventAt')} aria-invalid={Boolean(form.formState.errors.customerEventAt)} className="mt-1 w-full rounded-lg border p-2 aria-[invalid=true]:border-red-600" />
            {form.formState.errors.customerEventAt && <span className="mt-1 block text-sm text-red-700">{form.formState.errors.customerEventAt.message}</span>}
          </label>
          <label>Valor total<input disabled value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)} className="mt-1 w-full rounded-lg border bg-nobre-paper-shade p-2" /></label>
        </div>

        <section className="mt-5">
          <div className="flex justify-between">
            <h3 className="font-semibold">Brindes</h3>
            <button type="button" onClick={() => append({ productId: '', quantity: 1 })} className="inline-flex cursor-pointer items-center gap-1 text-nobre-forest"><Plus size={16} />Adicionar</button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="mt-2 grid grid-cols-[1fr_5rem_auto] gap-2">
              <div>
                <select {...form.register(`items.${index}.productId`)} aria-invalid={Boolean(form.formState.errors.items?.[index]?.productId)} className="w-full cursor-pointer rounded-lg border p-2 aria-[invalid=true]:border-red-600">
                  <option value="">Selecione</option>
                  {products.data?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                {form.formState.errors.items?.[index]?.productId && <span className="mt-1 block text-sm text-red-700">{form.formState.errors.items[index]?.productId?.message}</span>}
              </div>
              <div>
                <input type="number" min="1" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} aria-invalid={Boolean(form.formState.errors.items?.[index]?.quantity)} className="w-full rounded-lg border p-2 aria-[invalid=true]:border-red-600" />
                {form.formState.errors.items?.[index]?.quantity && <span className="mt-1 block text-sm text-red-700">{form.formState.errors.items[index]?.quantity?.message}</span>}
              </div>
              <button type="button" aria-label="Remover brinde" disabled={fields.length === 1} onClick={() => remove(index)} className="cursor-pointer rounded-md p-2 text-nobre-pitch transition-colors hover:bg-nobre-pitch hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={16} /></button>
            </div>
          ))}
        </section>

        <button disabled={save.isPending} className="mt-6 w-full cursor-pointer rounded-lg bg-nobre-forest-deep p-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{save.isPending ? 'Salvando...' : 'Salvar oportunidade'}</button>
      </form>
    </div>
  );
}
