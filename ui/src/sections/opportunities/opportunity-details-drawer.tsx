"use client";

import { useState } from "react";
import { opportunityStages, stageLabels, type Opportunity, type OpportunityStage } from "@/hooks/opportunities/types";

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value)) : "Não informado";
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

  const canMove = stage !== opportunity.stage && (stage !== "LOST" || lossReason.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-nobre-pitch/50 p-0 sm:p-4" role="presentation" onMouseDown={onClose}>
      <aside className="flex h-full w-full max-w-xl flex-col bg-nobre-paper shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="opportunity-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-nobre-forest-deep/10 bg-nobre-paper-shade px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-nobre-ink-soft">{opportunity.code}</p>
            <h2 id="opportunity-details-title" className="mt-1 text-xl font-semibold text-nobre-forest-deep">{opportunity.company.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-nobre-forest/25 px-3 py-2 text-sm font-medium text-nobre-forest-deep hover:border-nobre-forest">
            Fechar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-nobre-ink-soft">Vendedor</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{opportunity.seller.name}</dd></div>
            <div><dt className="text-nobre-ink-soft">Valor estimado</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{opportunity.estimatedValue === null ? "Não informado" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(opportunity.estimatedValue)}</dd></div>
            <div><dt className="text-nobre-ink-soft">Evento</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{formatDate(opportunity.customerEventAt)}</dd></div>
            <div><dt className="text-nobre-ink-soft">Validade da proposta</dt><dd className="mt-1 font-medium text-nobre-forest-deep">{formatDate(opportunity.proposalValidUntil)}</dd></div>
          </dl>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-nobre-forest-deep">Itens do orçamento</h3>
            <ul className="mt-3 space-y-2">
              {opportunity.items.map((item) => <li key={item.id} className="flex items-center justify-between rounded-lg bg-nobre-paper-shade px-3 py-2 text-sm text-nobre-forest-deep"><span>{item.productName}</span><span className="font-semibold">{item.quantity} un.</span></li>)}
            </ul>
          </section>

          <section className="mt-8 border-t border-nobre-forest-deep/10 pt-6">
            <label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">
              Mover oportunidade para
              <select value={stage} onChange={(event) => setStage(event.target.value as OpportunityStage)} className="rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 outline-none focus:border-nobre-forest focus:ring-2 focus:ring-nobre-sprout/60">
                {opportunityStages.map((value) => <option key={value} value={value}>{stageLabels[value]}</option>)}
              </select>
            </label>
            {stage === "LOST" && (
              <label className="mt-4 grid gap-1 text-sm font-medium text-nobre-forest-deep">
                Motivo da perda
                <textarea value={lossReason} onChange={(event) => setLossReason(event.target.value)} rows={3} placeholder="Descreva o motivo da perda" className="resize-none rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 outline-none focus:border-nobre-forest focus:ring-2 focus:ring-nobre-sprout/60" />
              </label>
            )}
            {opportunity.lossReason && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">Motivo registrado: {opportunity.lossReason}</p>}
          </section>
        </div>

        <footer className="border-t border-nobre-forest-deep/10 px-6 py-4">
          <button type="button" disabled={!canMove || isMoving} onClick={() => onMove(stage, lossReason)} className="w-full rounded-lg bg-nobre-forest-deep px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-nobre-forest">
            {isMoving ? "Movendo oportunidade..." : "Confirmar movimentação"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
