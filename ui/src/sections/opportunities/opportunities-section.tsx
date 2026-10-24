"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { attentionLabels, attentionStatuses, opportunityStages, stageLabels, type AttentionStatus, type Opportunity } from "@/hooks/opportunities/types";
import { useOpportunities } from "@/hooks/opportunities/use-opportunities";
import { OpportunityCard } from "./opportunity-card";

function OpportunityColumn({ stage, opportunities }: { stage: (typeof opportunityStages)[number]; opportunities: Opportunity[] }) {
  return (
    <section className="min-w-72 flex-1 rounded-2xl bg-slate-100 p-3" aria-labelledby={`stage-${stage}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id={`stage-${stage}`} className="text-sm font-semibold text-slate-800">{stageLabels[stage]}</h2>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">{opportunities.length}</span>
      </div>
      <div className="space-y-3">
        {opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}
        {opportunities.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-center text-sm text-slate-500">Nenhuma oportunidade.</p>}
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
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Atenção
            <select value={attentionStatus} onChange={(event) => setAttentionStatus(event.target.value as AttentionStatus | "ALL")} className="min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
              <option value="ALL">Todas</option>
              {attentionStatuses.map((status) => <option key={status} value={status}>{attentionLabels[status]}</option>)}
            </select>
          </label>
        }
      />

      {opportunitiesQuery.isLoading && <p className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">Carregando oportunidades...</p>}
      {opportunitiesQuery.isError && <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert">
        <p className="font-semibold">Não foi possível carregar as oportunidades.</p>
        <button type="button" onClick={() => void opportunitiesQuery.refetch()} className="mt-3 rounded-md bg-red-900 px-3 py-2 text-sm font-medium text-white">Tentar novamente</button>
      </div>}
      {!opportunitiesQuery.isLoading && !opportunitiesQuery.isError && <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        {opportunityStages.map((stage) => <OpportunityColumn key={stage} stage={stage} opportunities={opportunitiesByStage[stage]} />)}
      </div>}
    </section>
  );
}
