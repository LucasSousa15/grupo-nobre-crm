"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useChangeOpportunityStage } from "@/hooks/opportunities/use-change-opportunity-stage";
import { attentionLabels, attentionStatuses, opportunityStages, stageLabels, type AttentionStatus, type Opportunity, type OpportunityStage } from "@/hooks/opportunities/types";
import { useOpportunities } from "@/hooks/opportunities/use-opportunities";
import type { Seller } from "@/hooks/sellers/types";
import { OpportunityCard } from "./opportunity-card";
import { OpportunityDetailsDrawer } from "./opportunity-details-drawer";

const attentionCards: Record<AttentionStatus, { description: string; className: string }> = {
  NORMAL: { description: "Carteira sob controle", className: "border-nobre-forest-deep/15 bg-nobre-paper text-nobre-forest-deep hover:border-nobre-forest" },
  DUE_SOON: { description: "Priorize o próximo contato", className: "border-nobre-forest/20 bg-nobre-moss text-nobre-forest-deep hover:border-nobre-forest" },
  OVERDUE: { description: "Retorno precisa de ação", className: "border-nobre-crown/70 bg-nobre-crown/25 text-nobre-pitch hover:border-nobre-crown" },
  CRITICAL: { description: "Risco alto de perda", className: "border-nobre-pitch bg-nobre-pitch text-nobre-paper hover:bg-nobre-forest-deep" },
};

const stageStyles: Record<OpportunityStage, { column: string; count: string }> = {
  FIRST_CONTACT: { column: "border-t-nobre-forest", count: "bg-nobre-moss text-nobre-forest-deep" },
  QUOTE_PRESENTATION: { column: "border-t-nobre-forest-deep", count: "bg-nobre-forest-deep text-nobre-crown" },
  FOLLOW_UP: { column: "border-t-nobre-crown", count: "bg-nobre-crown/30 text-nobre-pitch" },
  FORECAST: { column: "border-t-nobre-sprout", count: "bg-nobre-sprout/55 text-nobre-pitch" },
  CLOSED: { column: "border-t-nobre-forest", count: "bg-nobre-forest text-white" },
  LOST: { column: "border-t-nobre-pitch", count: "bg-nobre-pitch text-nobre-sprout" },
};

function OpportunityColumn({ stage, opportunities, onOpen, onDragStart, onDrop }: { stage: OpportunityStage; opportunities: Opportunity[]; onOpen: (opportunity: Opportunity) => void; onDragStart: (opportunity: Opportunity) => void; onDrop: (stage: OpportunityStage) => void }) {
  const style = stageStyles[stage];
  return (
    <section onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(stage)} className={`min-w-72 flex-1 rounded-2xl border-t-4 bg-nobre-paper-shade p-3 shadow-sm ${style.column}`} aria-labelledby={`stage-${stage}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id={`stage-${stage}`} className="text-sm font-semibold text-nobre-forest-deep">{stageLabels[stage]}</h2>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${style.count}`}>{opportunities.length}</span>
      </div>
      <div className="space-y-3">
        {opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} onOpen={() => onOpen(opportunity)} onDragStart={() => onDragStart(opportunity)} />)}
        {opportunities.length === 0 && <p className="rounded-xl border border-dashed border-nobre-forest/25 bg-nobre-paper/70 p-4 text-center text-sm text-nobre-ink-soft">Solte uma oportunidade aqui.</p>}
      </div>
    </section>
  );
}

export function OpportunitiesSection({ seller, onChangeSeller }: { seller: Seller; onChangeSeller: () => void }) {
  const [attentionStatus, setAttentionStatus] = useState<AttentionStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [requestedStage, setRequestedStage] = useState<OpportunityStage | undefined>();
  const [moveError, setMoveError] = useState<string | null>(null);
  const changeStage = useChangeOpportunityStage();
  const opportunitiesQuery = useOpportunities({ sellerId: seller.id });
  const opportunities = useMemo(() => {
    const allOpportunities = opportunitiesQuery.data ?? [];
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return allOpportunities.filter((opportunity) => {
      const matchesAttention = attentionStatus === "ALL" || opportunity.attentionStatus === attentionStatus;
      const matchesSearch = !term || opportunity.code.toLocaleLowerCase("pt-BR").includes(term) || opportunity.company.name.toLocaleLowerCase("pt-BR").includes(term);
      return matchesAttention && matchesSearch;
    });
  }, [opportunitiesQuery.data, attentionStatus, search]);
  const attentionCount = useMemo(() => (opportunitiesQuery.data ?? []).reduce<Record<AttentionStatus, number>>(
    (count, opportunity) => ({ ...count, [opportunity.attentionStatus]: count[opportunity.attentionStatus] + 1 }),
    { NORMAL: 0, DUE_SOON: 0, OVERDUE: 0, CRITICAL: 0 },
  ), [opportunitiesQuery.data]);
  const opportunitiesByStage = opportunityStages.reduce<Record<OpportunityStage, Opportunity[]>>(
    (groups, stage) => ({ ...groups, [stage]: opportunities.filter((opportunity) => opportunity.stage === stage) }),
    {} as Record<OpportunityStage, Opportunity[]>,
  );

  function openDetails(opportunity: Opportunity, stage?: OpportunityStage) {
    setRequestedStage(stage);
    setSelectedOpportunity(opportunity);
  }

  function moveOpportunity(opportunity: Opportunity, stage: OpportunityStage, lossReason?: string) {
    if (stage === opportunity.stage) return;
    setMoveError(null);
    changeStage.mutate(
      { opportunityId: opportunity.id, stage, lossReason: lossReason?.trim() },
      {
        onSuccess: () => {
          setSelectedOpportunity(null);
          setRequestedStage(undefined);
        },
        onError: () => setMoveError("Não foi possível mover a oportunidade. Confira os pré-requisitos da etapa e tente novamente."),
      },
    );
  }

  function handleDrop(stage: OpportunityStage) {
    const opportunity = draggedOpportunity;
    setDraggedOpportunity(null);
    if (!opportunity || opportunity.stage === stage) return;
    if (stage === "LOST") {
      openDetails(opportunity, stage);
      return;
    }
    moveOpportunity(opportunity, stage);
  }

  return (
    <section>
      <PageHeader
        title={`Carteira de ${seller.name}`}
        description="Pesquise, priorize e mova as oportunidades da sua carteira pelo funil comercial."
        action={
          <div className="flex flex-wrap items-end gap-3">
            <button type="button" onClick={onChangeSeller} className="rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 text-sm font-medium text-nobre-forest-deep hover:border-nobre-forest hover:text-nobre-forest">
              Trocar vendedor
            </button>
            <label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">
              Atenção
              <select value={attentionStatus} onChange={(event) => setAttentionStatus(event.target.value as AttentionStatus | "ALL")} className="min-w-40 rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 text-sm outline-none focus:border-nobre-forest focus:ring-2 focus:ring-nobre-sprout/60">
                <option value="ALL">Todas</option>
                {attentionStatuses.map((status) => <option key={status} value={status}>{attentionLabels[status]}</option>)}
              </select>
            </label>
          </div>
        }
      />

      <section className="mt-8" aria-labelledby="attention-overview-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 id="attention-overview-title" className="font-semibold text-nobre-forest-deep">Prioridades da carteira</h2>
            <p className="mt-1 text-sm text-nobre-ink-soft">Clique em um status para filtrar o Kanban.</p>
          </div>
          {attentionStatus !== "ALL" && <button type="button" onClick={() => setAttentionStatus("ALL")} className="rounded-md px-2 py-1 text-sm font-semibold text-nobre-forest underline-offset-4 transition-colors hover:bg-nobre-moss hover:underline">Ver todas</button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {attentionStatuses.map((status) => {
            const selected = attentionStatus === status;
            const card = attentionCards[status];
            return <button key={status} type="button" aria-pressed={selected} disabled={opportunitiesQuery.isLoading} onClick={() => setAttentionStatus(selected ? "ALL" : status)} className={`rounded-2xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-nobre-sprout disabled:cursor-wait disabled:opacity-60 ${card.className} ${selected ? "ring-2 ring-nobre-forest ring-offset-2" : ""}`}>
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">{attentionLabels[status]}</span>
              <span className="mt-3 block text-3xl font-semibold tracking-tight">{attentionCount[status]}</span>
              <span className="mt-1 block text-sm opacity-80">{card.description}</span>
            </button>;
          })}
        </div>
      </section>

      <label className="mt-6 block max-w-xl text-sm font-medium text-nobre-forest-deep">
        Buscar oportunidade
        <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Código ou empresa" className="mt-1 w-full rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2.5 text-sm outline-none placeholder:text-nobre-ink-soft focus:border-nobre-forest focus:ring-2 focus:ring-nobre-sprout/60" />
      </label>

      {moveError && <div className="mt-6 rounded-xl border border-nobre-crown/70 bg-nobre-crown/25 p-4 text-sm text-nobre-pitch" role="alert">{moveError}</div>}
      {opportunitiesQuery.isLoading && <p className="mt-8 rounded-xl border border-nobre-forest/20 bg-nobre-paper p-5 text-sm text-nobre-ink-soft" role="status">Carregando oportunidades...</p>}
      {opportunitiesQuery.isError && <div className="mt-8 rounded-xl border border-nobre-crown/70 bg-nobre-crown/25 p-5 text-sm text-nobre-pitch" role="alert">
        <p className="font-semibold">Não foi possível carregar as oportunidades.</p>
        <button type="button" onClick={() => void opportunitiesQuery.refetch()} className="mt-3 rounded-md bg-nobre-forest-deep px-3 py-2 text-sm font-medium text-white hover:bg-nobre-forest">Tentar novamente</button>
      </div>}
      {!opportunitiesQuery.isLoading && !opportunitiesQuery.isError && opportunities.length === 0 && <p className="mt-8 rounded-xl border border-dashed border-nobre-forest/25 bg-nobre-paper-shade p-8 text-center text-sm text-nobre-ink-soft">Nenhuma oportunidade corresponde aos filtros desta carteira.</p>}
      {!opportunitiesQuery.isLoading && !opportunitiesQuery.isError && opportunities.length > 0 && <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        {opportunityStages.map((stage) => <OpportunityColumn key={stage} stage={stage} opportunities={opportunitiesByStage[stage]} onOpen={openDetails} onDragStart={setDraggedOpportunity} onDrop={handleDrop} />)}
      </div>}

      {selectedOpportunity && <OpportunityDetailsDrawer key={`${selectedOpportunity.id}:${requestedStage ?? selectedOpportunity.stage}`} opportunity={selectedOpportunity} requestedStage={requestedStage} onClose={() => { setSelectedOpportunity(null); setRequestedStage(undefined); }} onMove={(stage, lossReason) => moveOpportunity(selectedOpportunity, stage, lossReason)} isMoving={changeStage.isPending} />}
    </section>
  );
}
