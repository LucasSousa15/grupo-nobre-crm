"use client";

import { useState } from "react";
import { ArrowRight, CalendarDays, CircleDollarSign, ContactRound, History, Mail, Phone, RefreshCw, X } from "lucide-react";
import { opportunityStages, stageLabels, type Opportunity, type OpportunityStage } from "@/hooks/opportunities/types";
import { useOpportunityHistory } from "@/hooks/opportunities/use-opportunity-history";

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value)) : "Não informado";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function OpportunityDetailsDrawer({
  opportunity,
  requestedStage,
  onClose,
  onMove,
  isMoving,
}: {
  opportunity: Opportunity;
  requestedStage?: OpportunityStage;
  onClose: () => void;
  onMove: (stage: OpportunityStage, lossReason?: string) => void;
  isMoving: boolean;
}) {
  const [stage, setStage] = useState<OpportunityStage>(requestedStage ?? opportunity.stage);
  const [lossReason, setLossReason] = useState(opportunity.lossReason ?? "");
  const historyQuery = useOpportunityHistory(opportunity.id);

  const canMove = stage !== opportunity.stage && (stage !== "LOST" || lossReason.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-nobre-pitch/50 p-0 sm:p-4" role="presentation" onMouseDown={onClose}>
      <aside className="flex h-full w-full max-w-xl flex-col bg-nobre-paper shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="opportunity-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-nobre-forest-deep/10 bg-nobre-paper-shade px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-nobre-ink-soft">{opportunity.code}</p>
            <h2 id="opportunity-details-title" className="mt-1 text-xl font-semibold text-nobre-forest-deep">{opportunity.company.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-nobre-forest/25 px-3 py-2 text-sm font-medium text-nobre-forest-deep transition-colors hover:border-nobre-forest hover:bg-nobre-moss">
            <X size={16} aria-hidden /> Fechar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-nobre-ink-soft">Vendedor</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{opportunity.seller.name}</dd></div>
            <div><dt className="inline-flex items-center gap-1 text-nobre-ink-soft"><CircleDollarSign size={14} aria-hidden />Valor estimado</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{opportunity.estimatedValue === null ? "Não informado" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(opportunity.estimatedValue)}</dd></div>
            <div><dt className="inline-flex items-center gap-1 text-nobre-ink-soft"><CalendarDays size={14} aria-hidden />Evento</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{formatDate(opportunity.customerEventAt)}</dd></div>
            <div><dt className="text-nobre-ink-soft">Validade da proposta</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{formatDate(opportunity.proposalValidUntil)}</dd></div>
          </dl>

          <section className="mt-8 rounded-xl border border-nobre-forest/15 bg-nobre-paper-shade p-4" aria-labelledby="customer-contact-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-nobre-forest"><ContactRound size={14} aria-hidden />Contato do cliente</p>
                <h3 id="customer-contact-title" className="mt-1 font-semibold text-nobre-forest-deep">{opportunity.company.contactName}</h3>
                <p className="mt-1 text-sm text-nobre-ink-soft">{opportunity.company.name}</p>
              </div>
              <span className="rounded-full bg-nobre-moss px-2.5 py-1 text-xs font-semibold text-nobre-forest-deep">Pronto para contato</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {opportunity.company.contactEmail ? (
                <a href={`mailto:${opportunity.company.contactEmail}`} className="cursor-pointer rounded-lg border border-nobre-forest/20 bg-nobre-paper px-3 py-2.5 text-sm font-medium text-nobre-forest-deep transition-colors hover:border-nobre-forest hover:bg-nobre-moss">
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-nobre-ink-soft"><Mail size={13} aria-hidden />E-mail</span>
                  <span className="mt-1 block truncate">{opportunity.company.contactEmail}</span>
                </a>
              ) : <p className="rounded-lg border border-dashed border-nobre-forest/20 bg-nobre-paper px-3 py-2.5 text-sm text-nobre-ink-soft">E-mail não informado</p>}
              {opportunity.company.contactPhone ? (
                <a href={`tel:${opportunity.company.contactPhone.replace(/\D/g, "")}`} className="cursor-pointer rounded-lg border border-nobre-forest/20 bg-nobre-paper px-3 py-2.5 text-sm font-medium text-nobre-forest-deep transition-colors hover:border-nobre-forest hover:bg-nobre-moss">
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-nobre-ink-soft"><Phone size={13} aria-hidden />Telefone</span>
                  <span className="mt-1 block">{opportunity.company.contactPhone}</span>
                </a>
              ) : <p className="rounded-lg border border-dashed border-nobre-forest/20 bg-nobre-paper px-3 py-2.5 text-sm text-nobre-ink-soft">Telefone não informado</p>}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-nobre-forest-deep">Itens do orçamento</h3>
            <ul className="mt-3 space-y-2">
              {opportunity.items.map((item) => <li key={item.id} className="flex items-center justify-between rounded-lg bg-nobre-paper-shade px-3 py-2 text-sm text-nobre-forest-deep"><span>{item.productName}</span><span className="font-semibold">{item.quantity} un.</span></li>)}
            </ul>
          </section>

          <section className="mt-8 border-t border-nobre-forest-deep/10 pt-6" aria-labelledby="opportunity-history-title">
            <h3 id="opportunity-history-title" className="inline-flex items-center gap-2 text-sm font-semibold text-nobre-forest-deep"><History size={16} aria-hidden />Linha do tempo</h3>
            {historyQuery.isLoading && <p className="mt-3 text-sm text-nobre-ink-soft" role="status">Carregando movimentações...</p>}
            {historyQuery.isError && <div className="mt-3 rounded-lg border border-nobre-crown/70 bg-nobre-crown/25 p-3 text-sm text-nobre-pitch" role="alert">
              <p>Não foi possível carregar o histórico.</p>
              <button type="button" onClick={() => void historyQuery.refetch()} className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-nobre-forest underline-offset-4 hover:underline"><RefreshCw size={14} aria-hidden />Tentar novamente</button>
            </div>}
            {!historyQuery.isLoading && !historyQuery.isError && historyQuery.data?.length === 0 && <p className="mt-3 rounded-lg border border-dashed border-nobre-forest/20 bg-nobre-paper-shade p-3 text-sm text-nobre-ink-soft">Nenhuma mudança de etapa registrada ainda.</p>}
            {!historyQuery.isLoading && !historyQuery.isError && historyQuery.data && historyQuery.data.length > 0 && (
              <ol className="mt-4 space-y-4 border-l-2 border-nobre-moss pl-4">
                {historyQuery.data.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span aria-hidden className="absolute -left-[1.375rem] top-1 size-3 rounded-full border-2 border-nobre-paper bg-nobre-forest" />
                    <p className="flex flex-wrap items-center gap-1 text-sm font-medium text-nobre-forest-deep"><span>{stageLabels[entry.fromStage]}</span><ArrowRight size={14} aria-hidden /><span>{stageLabels[entry.toStage]}</span></p>
                    <time dateTime={entry.changedAt} className="mt-1 block text-xs text-nobre-ink-soft">{formatTimestamp(entry.changedAt)}</time>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="mt-8 border-t border-nobre-forest-deep/10 pt-6">
            <label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">
              Mover oportunidade para
              <select value={stage} onChange={(event) => setStage(event.target.value as OpportunityStage)} className="cursor-pointer rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 outline-none focus:border-nobre-forest focus:ring-2 focus:ring-nobre-sprout/60">
                {opportunityStages.map((value) => <option key={value} value={value}>{stageLabels[value]}</option>)}
              </select>
            </label>
            {stage === "LOST" && (
              <label className="mt-4 grid gap-1 text-sm font-medium text-nobre-forest-deep">
                Motivo da perda
                <textarea value={lossReason} onChange={(event) => setLossReason(event.target.value)} rows={3} placeholder="Descreva o motivo da perda" className="resize-none rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 outline-none focus:border-nobre-forest focus:ring-2 focus:ring-nobre-sprout/60" />
              </label>
            )}
            {opportunity.lossReason && <p className="mt-4 rounded-lg border border-nobre-crown/70 bg-nobre-crown/25 p-3 text-sm text-nobre-pitch">Motivo registrado: {opportunity.lossReason}</p>}
          </section>
        </div>

        <footer className="border-t border-nobre-forest-deep/10 px-6 py-4">
          <button type="button" disabled={!canMove || isMoving} onClick={() => onMove(stage, lossReason)} className="w-full cursor-pointer rounded-lg bg-nobre-forest-deep px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-nobre-forest">
            {isMoving ? "Movendo oportunidade..." : "Confirmar movimentação"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
