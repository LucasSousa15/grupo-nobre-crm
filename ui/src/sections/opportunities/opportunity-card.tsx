import { AttentionBadge } from "@/components/attention-badge";
import type { Opportunity } from "@/hooks/opportunities/types";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatDate(value: string | null) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <article className="rounded-xl border border-nobre-forest-deep/15 bg-nobre-paper p-4 shadow-sm transition-shadow hover:border-nobre-forest/40 hover:shadow-md">
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
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-900">
          Venda perdida: {opportunity.lossReason}
        </p>
      )}
    </article>
  );
}
