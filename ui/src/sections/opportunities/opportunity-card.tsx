import { AttentionBadge } from "@/components/attention-badge";
import type { AttentionStatus, Opportunity } from "@/hooks/opportunities/types";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatDate(value: string | null) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

const attentionAccent: Record<AttentionStatus, string> = {
  NORMAL: "border-l-nobre-forest/35",
  DUE_SOON: "border-l-nobre-forest",
  OVERDUE: "border-l-nobre-crown",
  CRITICAL: "border-l-nobre-pitch",
};

export function OpportunityCard({ opportunity, onOpen, onDragStart }: { opportunity: Opportunity; onOpen: () => void; onDragStart: () => void }) {
  return (
    <article draggable onDragStart={onDragStart} className={`cursor-grab rounded-xl border border-l-4 border-nobre-forest-deep/15 bg-nobre-paper p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-nobre-forest/40 hover:shadow-md active:cursor-grabbing ${attentionAccent[opportunity.attentionStatus]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-nobre-ink-soft">{opportunity.code}</p>
        <AttentionBadge status={opportunity.attentionStatus} />
      </div>
      <h3 className="mt-3 font-semibold text-nobre-forest-deep">{opportunity.company.name}</h3>
      <p className="mt-1 text-sm text-nobre-ink-soft">{opportunity.seller.name}</p>
      <p className="mt-4 text-lg font-semibold text-nobre-forest-deep">{opportunity.estimatedValue === null ? "Valor não informado" : currency.format(opportunity.estimatedValue)}</p>
      <dl className="mt-4 space-y-2 border-t border-nobre-forest-deep/10 pt-3 text-xs text-nobre-ink-soft">
        <div className="flex justify-between gap-3"><dt>Último contato</dt><dd className="font-medium text-nobre-forest-deep">{formatDate(opportunity.lastContactAt)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Próximo follow-up</dt><dd className="font-medium text-nobre-forest-deep">{formatDate(opportunity.nextFollowUpAt)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Evento</dt><dd className="font-medium text-nobre-forest-deep">{formatDate(opportunity.customerEventAt)}</dd></div>
      </dl>
      {opportunity.stage === "LOST" && opportunity.lossReason && (
        <p className="mt-4 rounded-lg border border-nobre-crown/60 bg-nobre-crown/20 p-3 text-xs font-medium text-nobre-pitch">
          Venda perdida: {opportunity.lossReason}
        </p>
      )}
      <button type="button" onClick={onOpen} className="mt-4 w-full cursor-pointer rounded-lg border border-nobre-forest/25 px-3 py-2 text-sm font-medium text-nobre-forest-deep transition-colors hover:border-nobre-forest hover:bg-nobre-moss">
        Consultar oportunidade
      </button>
    </article>
  );
}
