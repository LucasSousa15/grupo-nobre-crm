'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  ContactRound,
  FilePenLine,
  History,
  Mail,
  Phone,
  RefreshCw,
  X,
} from 'lucide-react';
import { formatCivilDate, formatTimestamp } from '@/lib/date-format';
import { stageLabels, type Opportunity, type OpportunityStage } from '@/hooks/opportunities/types';
import { useOpportunityHistory } from '@/hooks/opportunities/use-opportunity-history';
import { OpportunityProposalEditor } from './opportunity-proposal-editor';

type OpportunityDetailsDrawerProps = {
  opportunity: Opportunity;
  requestedStage?: OpportunityStage;
  onClose: () => void;
  onMove: (stage: OpportunityStage, lossReason?: string) => void;
  onOpportunityUpdated: (opportunity: Opportunity) => void;
  isMoving: boolean;
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function OpportunityDetailsDrawer({
  opportunity,
  requestedStage,
  onClose,
  onMove,
  onOpportunityUpdated,
  isMoving,
}: OpportunityDetailsDrawerProps) {
  const [stage, setStage] = useState<OpportunityStage>(requestedStage ?? opportunity.stage);
  const [lossReason, setLossReason] = useState(opportunity.lossReason ?? '');
  const [editingProposal, setEditingProposal] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const historyQuery = useOpportunityHistory(opportunity.id);
  const selectedOption = opportunity.transitionOptions.find((option) => option.stage === stage);
  const isFinal = opportunity.stage === 'CLOSED' || opportunity.stage === 'LOST';
  const canMove = Boolean(selectedOption?.enabled) && (stage !== 'LOST' || lossReason.trim().length > 0);
  const emptyTransitionMessage = isFinal
    ? 'Etapa final: sem novas movimentações'
    : 'Nenhuma movimentação disponível';

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('button, select, textarea, input, a[href]')?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;

    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not(:disabled), select:not(:disabled), textarea:not(:disabled), input:not(:disabled), a[href]',
    )];
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleProposalSaved(updated: Opportunity) {
    setEditingProposal(false);
    onOpportunityUpdated(updated);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-nobre-pitch/50 p-0 sm:p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <aside
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col bg-nobre-paper shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="opportunity-details-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-nobre-forest-deep/10 bg-nobre-paper-shade px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-nobre-ink-soft">{opportunity.code}</p>
            <h2 id="opportunity-details-title" className="mt-1 text-xl font-semibold text-nobre-forest-deep">
              {opportunity.company.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-nobre-forest/25 px-3 py-2 text-sm font-medium text-nobre-forest-deep hover:bg-nobre-moss"
          >
            <X size={16} aria-hidden />
            Fechar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-nobre-ink-soft">Vendedor</dt>
              <dd className="mt-1 font-medium text-nobre-forest-deep">{opportunity.seller.name}</dd>
            </div>
            <div>
              <dt className="inline-flex items-center gap-1 text-nobre-ink-soft"><CircleDollarSign size={14} aria-hidden />Valor estimado</dt>
              <dd className="mt-1 font-medium text-nobre-forest-deep">
                {opportunity.estimatedValue === null ? 'Não informado' : currency.format(opportunity.estimatedValue)}
              </dd>
            </div>
            <div>
              <dt className="inline-flex items-center gap-1 text-nobre-ink-soft"><CalendarDays size={14} aria-hidden />Evento</dt>
              <dd className="mt-1 font-medium text-nobre-forest-deep">{formatCivilDate(opportunity.customerEventAt)}</dd>
            </div>
            <div>
              <dt className="text-nobre-ink-soft">Validade da proposta</dt>
              <dd className="mt-1 font-medium text-nobre-forest-deep">{formatCivilDate(opportunity.proposalValidUntil)}</dd>
            </div>
          </dl>

          <section className="mt-7 rounded-xl border border-nobre-forest/15 bg-nobre-paper-shade p-4">
            <div className="flex items-start gap-3">
              <div>
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-nobre-forest"><ContactRound size={14} aria-hidden />Contato do cliente</p>
                <h3 className="mt-1 font-semibold text-nobre-forest-deep">{opportunity.company.contactName}</h3>
                <p className="mt-1 text-sm text-nobre-ink-soft">{opportunity.company.name}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {opportunity.company.contactEmail ? (
                <a href={`mailto:${opportunity.company.contactEmail}`} className="cursor-pointer text-sm text-nobre-forest-deep"><Mail className="inline" size={13} aria-hidden /> {opportunity.company.contactEmail}</a>
              ) : <p className="text-sm text-nobre-ink-soft">E-mail não informado</p>}
              {opportunity.company.contactPhone ? (
                <a href={`tel:${opportunity.company.contactPhone.replace(/\D/g, '')}`} className="cursor-pointer text-sm text-nobre-forest-deep"><Phone className="inline" size={13} aria-hidden /> {opportunity.company.contactPhone}</a>
              ) : <p className="text-sm text-nobre-ink-soft">Telefone não informado</p>}
            </div>
          </section>

          <section className="mt-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-nobre-forest-deep">Detalhes da proposta</h3>
                <p className="mt-1 text-sm text-nobre-ink-soft">Itens, valor calculado, validade e data do evento.</p>
              </div>
              {!isFinal && (
                <button
                  type="button"
                  onClick={() => setEditingProposal((current) => !current)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-nobre-forest hover:bg-nobre-moss"
                >
                  <FilePenLine size={14} aria-hidden />
                  {editingProposal ? 'Cancelar edição' : 'Editar proposta'}
                </button>
              )}
            </div>

            {editingProposal ? (
              <OpportunityProposalEditor
                opportunity={opportunity}
                onCancel={() => setEditingProposal(false)}
                onSaved={handleProposalSaved}
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {opportunity.items.map((item) => (
                  <li key={item.id} className="flex justify-between rounded-lg bg-nobre-paper-shade px-3 py-2 text-sm">
                    <span>{item.productName}</span>
                    <span>{item.quantity} un.</span>
                  </li>
                ))}
                {opportunity.items.length === 0 && <li className="rounded-lg bg-nobre-paper-shade px-3 py-2 text-sm text-nobre-ink-soft">Nenhum brinde informado.</li>}
              </ul>
            )}
          </section>

          <section className="mt-7 border-t border-nobre-forest-deep/10 pt-5">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-nobre-forest-deep"><History size={16} aria-hidden />Linha do tempo</h3>
            {historyQuery.isLoading && <p role="status" className="mt-3 text-sm text-nobre-ink-soft">Carregando movimentações...</p>}
            {historyQuery.isError && <p role="alert" className="mt-3 text-sm text-nobre-pitch">Não foi possível carregar o histórico. <button type="button" onClick={() => void historyQuery.refetch()} className="cursor-pointer underline"><RefreshCw className="inline" size={14} aria-hidden />Tentar novamente</button></p>}
            {historyQuery.data?.map((entry) => (
              <div key={entry.id} className="mt-3 border-l-2 border-nobre-moss pl-3 text-sm">
                <p>{stageLabels[entry.fromStage]} <ArrowRight className="inline" size={14} aria-hidden /> {stageLabels[entry.toStage]}</p>
                <time className="text-xs text-nobre-ink-soft">{formatTimestamp(entry.changedAt)}</time>
              </div>
            ))}
          </section>

          <section className="mt-7 border-t border-nobre-forest-deep/10 pt-5">
            <label className="grid gap-1 text-sm font-medium text-nobre-forest-deep">
              Mover oportunidade para
              <select
                value={stage}
                disabled={opportunity.transitionOptions.length === 0}
                onChange={(event) => setStage(event.target.value as OpportunityStage)}
                className="cursor-pointer rounded-lg border border-nobre-forest/30 bg-nobre-paper px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {opportunity.transitionOptions.length === 0 ? <option value={opportunity.stage}>{emptyTransitionMessage}</option> : opportunity.transitionOptions.map((option) => (
                  <option key={option.stage} value={option.stage} disabled={!option.enabled}>
                    {stageLabels[option.stage]}{option.enabled ? '' : ' — pré-requisitos pendentes'}
                  </option>
                ))}
              </select>
            </label>
            {selectedOption && !selectedOption.enabled && (
              <ul className="mt-3 rounded-lg bg-nobre-crown/20 p-3 text-sm text-nobre-pitch">
                {selectedOption.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
              </ul>
            )}
            {stage === 'LOST' && (
              <label className="mt-4 grid gap-1 text-sm font-medium text-nobre-forest-deep">Motivo da perda
                <textarea value={lossReason} onChange={(event) => setLossReason(event.target.value)} rows={3} className="rounded-lg border border-nobre-forest/30 px-3 py-2" />
              </label>
            )}
          </section>
        </div>

        <footer className="border-t border-nobre-forest-deep/10 px-5 py-4">
          <button type="button" disabled={!canMove || isMoving} onClick={() => onMove(stage, lossReason)} className="w-full cursor-pointer rounded-lg bg-nobre-forest-deep px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {isMoving ? 'Movendo oportunidade...' : 'Confirmar movimentação'}
          </button>
        </footer>
      </aside>
    </div>
  );
}
