'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, Clock3, Info, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { crmApi } from '@/http/api';
import { formatTimestamp } from '@/lib/date-format';
import type { Opportunity } from '@/hooks/opportunities/types';
import { opportunityResponseSchema } from '@/schemas/opportunity-schema';
import { useOpportunityReminders } from '@/hooks/opportunities/use-opportunity-reminders';
import { notifyRequestError } from '@/lib/request-feedback';

const reminderLabels = {
  FOLLOW_UP_DUE: 'Follow-up próximo',
  FOLLOW_UP_OVERDUE: 'Follow-up vencido',
  PROPOSAL_EXPIRING: 'Proposta próxima do vencimento',
  PROPOSAL_EXPIRED: 'Proposta vencida',
  CUSTOMER_EVENT_APPROACHING: 'Evento se aproximando',
} as const;

const scheduleSchema = z.object({
  nextFollowUpAt: z.string().min(1, 'Informe quando o retorno deve acontecer.').refine(
    (value) => new Date(value) > new Date(),
    'O próximo follow-up deve ser agendado para o futuro.',
  ),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

export function OpportunityFollowUpPanel({ opportunity, onUpdated }: { opportunity: Opportunity; onUpdated: (opportunity: Opportunity) => void }) {
  const reminders = useOpportunityReminders(opportunity.id);
  const queryClient = useQueryClient();
  const form = useForm<ScheduleForm>({ defaultValues: { nextFollowUpAt: '' } });

  async function refresh(updated?: Opportunity) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
      queryClient.invalidateQueries({ queryKey: ['opportunities', opportunity.id, 'reminders'] }),
    ]);
    if (updated) onUpdated(updated);
  }

  const registerContact = useMutation({
    mutationFn: async () => opportunityResponseSchema.parse((await crmApi.patch(`/opportunities/${opportunity.id}`, {
      lastContactAt: new Date().toISOString(),
    })).data).opportunity,
    onSuccess: async (updated) => {
      await refresh(updated);
      toast.success('Contato registrado com sucesso.');
    },
    onError: (error) => notifyRequestError(error, 'Não foi possível registrar o contato agora.'),
  });
  const schedule = useMutation({
    mutationFn: async (values: ScheduleForm) => opportunityResponseSchema.parse((await crmApi.patch(`/opportunities/${opportunity.id}`, {
      nextFollowUpAt: new Date(values.nextFollowUpAt).toISOString(),
    })).data).opportunity,
    onSuccess: async (updated) => {
      form.reset();
      await refresh(updated);
      toast.success('Follow-up agendado com sucesso.');
    },
    onError: (error) => notifyRequestError(error, 'Não foi possível agendar o follow-up.'),
  });
  const dismiss = useMutation({
    mutationFn: async (reminderId: string) => crmApi.patch(`/opportunities/${opportunity.id}/reminders/${reminderId}/dismiss`),
    onSuccess: async () => {
      await refresh();
      toast.success('Lembrete concluído.');
    },
    onError: (error) => notifyRequestError(error, 'Não foi possível concluir o lembrete.'),
  });

  function submit(values: ScheduleForm) {
    const result = scheduleSchema.safeParse(values);
    if (!result.success) {
      form.setError('nextFollowUpAt', { message: result.error.issues[0]?.message });
      toast.error(result.error.issues[0]?.message ?? 'Informe uma data válida para o follow-up.');
      return;
    }
    schedule.mutate(result.data);
  }

  const openReminders = reminders.data?.filter((reminder) => reminder.status === 'OPEN') ?? [];
  return <section className="mt-7 rounded-xl border border-nobre-forest/20 bg-nobre-moss/45 p-4" aria-labelledby="follow-up-title">
    <div className="flex items-start gap-3"><CalendarClock size={19} aria-hidden className="mt-0.5 shrink-0 text-nobre-forest" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 id="follow-up-title" className="text-sm font-semibold text-nobre-forest-deep">Acompanhamento de follow-up</h3><span className="rounded-full bg-nobre-paper px-2 py-1 text-xs font-semibold text-nobre-forest-deep">Automação ativa</span></div><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-nobre-ink-soft">Último contato</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{opportunity.lastContactAt ? formatTimestamp(opportunity.lastContactAt) : 'Ainda não registrado'}</dd></div><div><dt className="text-nobre-ink-soft">Próximo follow-up</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{opportunity.nextFollowUpAt ? formatTimestamp(opportunity.nextFollowUpAt) : 'Nenhum agendamento'}</dd></div></dl>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => registerContact.mutate()} disabled={registerContact.isPending} className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-nobre-forest-deep px-3 py-2 text-sm font-semibold text-white hover:bg-nobre-forest disabled:cursor-not-allowed disabled:opacity-60"><Check size={16} aria-hidden />{registerContact.isPending ? 'Registrando...' : 'Registrar contato agora'}</button></div>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"><label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">Agendar próximo follow-up<input type="datetime-local" {...form.register('nextFollowUpAt')} aria-invalid={Boolean(form.formState.errors.nextFollowUpAt)} className="rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 aria-[invalid=true]:border-red-600" />{form.formState.errors.nextFollowUpAt && <span className="text-xs text-red-700">{form.formState.errors.nextFollowUpAt.message}</span>}</label><button disabled={schedule.isPending} className="self-end inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 text-sm font-semibold text-nobre-forest-deep hover:bg-nobre-moss disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} aria-hidden />Agendar</button></form>
      <div className="mt-5 border-t border-nobre-forest/15 pt-4"><h4 className="inline-flex items-center gap-1 text-sm font-semibold text-nobre-forest-deep"><Clock3 size={15} aria-hidden />Lembretes abertos</h4>{reminders.isLoading && <p className="mt-2 text-sm text-nobre-ink-soft">Carregando lembretes...</p>}{reminders.isError && <p className="mt-2 text-sm text-nobre-pitch">Não foi possível carregar os lembretes.</p>}{!reminders.isLoading && !reminders.isError && openReminders.length === 0 && <p className="mt-2 text-sm text-nobre-ink-soft">Nenhum lembrete pendente.</p>}<ul className="mt-2 space-y-2">{openReminders.map((reminder) => <li key={reminder.id} className="flex items-center justify-between gap-3 rounded-lg bg-nobre-paper px-3 py-2 text-sm"><span><strong className="font-semibold text-nobre-forest-deep">{reminderLabels[reminder.type]}</strong><span className="mt-0.5 block text-xs text-nobre-ink-soft">Prazo: {formatTimestamp(reminder.dueAt)}</span></span><button type="button" onClick={() => dismiss.mutate(reminder.id)} disabled={dismiss.isPending} className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-nobre-forest hover:bg-nobre-moss disabled:cursor-not-allowed">Concluir</button></li>)}</ul></div>
      <p className="mt-4 inline-flex items-start gap-2 text-xs text-nobre-ink-soft"><Info size={15} aria-hidden className="mt-0.5 shrink-0 text-nobre-forest" />Registrar um contato ou reagendar encerra lembretes de follow-up anteriores, mantendo a prioridade da carteira atualizada.</p>
    </div></div>
  </section>;
}
