import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Opportunity } from '@/hooks/opportunities/types';
import { OpportunityDetailsDrawer } from './opportunity-details-drawer';

vi.mock('@/hooks/opportunities/use-opportunity-history', () => ({
  useOpportunityHistory: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock('./opportunity-follow-up-panel', () => ({
  OpportunityFollowUpPanel: () => <div>Follow-up panel</div>,
}));

const opportunity: Opportunity = {
  id: 'opportunity-1',
  code: 'OPP-2001',
  stage: 'FOLLOW_UP',
  attentionStatus: 'NORMAL',
  estimatedValue: 4500,
  lastContactAt: null,
  nextFollowUpAt: null,
  proposalValidUntil: '2026-11-29T00:00:00.000Z',
  customerEventAt: '2026-11-30T00:00:00.000Z',
  lossReason: null,
  transitionOptions: [{ stage: 'FORECAST', enabled: true, requirements: [], requiresLossReason: false }],
  company: { id: 'company-1', name: 'Tech Alpha', contactName: 'Mariana', contactEmail: null, contactPhone: null },
  seller: { id: 'seller-1', name: 'Ana' },
  items: [{ id: 'item-1', productId: 'product-1', productName: 'Caneca', quantity: 300 }],
  createdAt: '2026-10-10T12:00:00.000Z',
  updatedAt: '2026-10-20T12:00:00.000Z',
};

function renderDrawer(onClose = vi.fn()) {
  render(
    <OpportunityDetailsDrawer
      opportunity={opportunity}
      onClose={onClose}
      onMove={vi.fn()}
      onOpportunityUpdated={vi.fn()}
      isMoving={false}
    />,
  );
  return onClose;
}

describe('OpportunityDetailsDrawer keyboard navigation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('closes with Escape', () => {
    const onClose = renderDrawer();

    screen.getByRole('dialog').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps focus inside the dialog after the last action', () => {
    renderDrawer();
    const dialog = screen.getByRole('dialog');
    const close = screen.getByRole('button', { name: 'Fechar' });
    const confirm = screen.getByRole('button', { name: 'Confirmar movimentação' });

    confirm.focus();
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(document.activeElement).toBe(close);
  });
});
