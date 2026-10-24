"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { attentionLabels, attentionStatuses, opportunityStages, stageLabels, type AttentionStatus, type Opportunity } from "@/hooks/opportunities/types";
import { useOpportunities } from "@/hooks/opportunities/use-opportunities";
import { OpportunityCard } from "./opportunity-card";

function OpportunityColumn({ stage, opportunities }: { stage: (typeof opportunityStages)[number]; opportunities: Opportunity[] }) {
  return (
    <section className="min-w-72 flex-1 rounded-2xl bg-nobre-paper-shade p-3" aria-labelledby={`stage-${stage}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id={`stage-${stage}`} className="text-sm font-semibold text-nobre-forest-deep">{stageLabels[stage]}</h2>
        <span className="rounded-full bg-nobre-paper px-2 py-1 text-xs font-medium text-nobre-ink-soft">{opportunities.length}</span>
      </div>
      <div className="space-y-3">
        {opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}
        {opportunities.length === 0 && <p className="rounded-xl border border-dashed border-nobre-forest/25 bg-nobre-paper/70 p-4 text-center text-sm text-nobre-ink-soft">Nenhuma oportunidade.</p>}
      </div>
    </section>
  );
}

export function OpportunitiesSection() {
  const [attentionStatus, setAttentionStatus] = useState<AttentionStatus | "ALL">("ALL");
  const opportunitiesQuery = useOpportunities(attentionStatus === "ALL" ? {} : { attentionStatus });
  const opportunitiesByStage = opportunityStages.reduce<Record<(typeof opportunityStages)[number], Opportunity[]>>(
    (groups, stage) => ({ ...groups, [stage]: opportunitiesQuery.data?.filter((opportunity) => opportunity.stage === stage) ?? [] }),
    {} as Record<(typeof opportunityStages)[number], Opportunity[]>,
  );

  return (
    <section>
      <PageHeader
        title="Oportunidades"
        description="Acompanhe o funil comercial, priorize negociações e identifique follow-ups que precisam de atenção."
        action={
          <label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">
            Atenção
            <select value={attentionStatus} onChange={(event) => setAttentionStatus(event.target.value as AttentionStatus | "ALL")} className="min-w-44 rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 text-sm outline-none focus:border-nobre-forest focus:ring-2 focus:ring-nobre-sprout/60">
              <option value="ALL">Todas</option>
              {attentionStatuses.map((status) => <option key={status} value={status}>{attentionLabels[status]}</option>)}
            </select>
          </label>
        }
      />

      {opportunitiesQuery.isLoading && <p className="mt-8 rounded-xl border border-nobre-forest/20 bg-nobre-paper p-5 text-sm text-nobre-ink-soft" role="status">Carregando oportunidades...</p>}
      {opportunitiesQuery.isError && <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert">
        <p className="font-semibold">Não foi possível carregar as oportunidades.</p>
        <button type="button" onClick={() => void opportunitiesQuery.refetch()} className="mt-3 rounded-md bg-nobre-forest-deep px-3 py-2 text-sm font-medium text-white hover:bg-nobre-forest">Tentar novamente</button>
      </div>}
      {!opportunitiesQuery.isLoading && !opportunitiesQuery.isError && <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        {opportunityStages.map((stage) => <OpportunityColumn key={stage} stage={stage} opportunities={opportunitiesByStage[stage]} />)}
      </div>}
    </section>
  );
}
