import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Opportunity } from '@/hooks/opportunities/types';
import { OpportunitiesSection } from './opportunities-section';

const useOpportunities = vi.hoisted(() => vi.fn());
const mutate = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/opportunities/use-opportunities', () => ({ useOpportunities }));
vi.mock('@/hooks/opportunities/use-change-opportunity-stage', () => ({
  useChangeOpportunityStage: () => ({ mutate, isPending: false }),
}));

const opportunity: Opportunity = {
  id: 'opportunity-1',
  code: 'OPP-2001',
  stage: 'FIRST_CONTACT',
  attentionStatus: 'NORMAL',
  estimatedValue: 4500,
  lastContactAt: null,
  nextFollowUpAt: null,
  proposalValidUntil: null,
  customerEventAt: '2026-11-30T00:00:00.000Z',
  lossReason: null,
  transitionOptions: [{ stage: 'FOLLOW_UP', enabled: true, requirements: [], requiresLossReason: false }],
  company: { id: 'company-1', name: 'Tech Alpha', contactName: 'Mariana', contactEmail: null, contactPhone: null },
  seller: { id: 'seller-1', name: 'Ana' },
  items: [],
  createdAt: '2026-10-10T12:00:00.000Z',
  updatedAt: '2026-10-20T12:00:00.000Z',
};

function renderSection() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <OpportunitiesSection seller={{ id: 'seller-1', name: 'Ana', email: 'ana@nobre.local', phone: null, active: true, createdAt: '', updatedAt: '' }} onChangeSeller={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('OpportunitiesSection', () => {
  beforeEach(() => {
    mutate.mockReset();
    mutate.mockImplementation((_input, callbacks) => callbacks?.onSuccess?.());
    useOpportunities.mockImplementation(() => ({
      data: {
        pages: [{
          opportunities: [opportunity],
          nextCursor: null,
          total: 1,
          attentionSummary: { NORMAL: 1, DUE_SOON: 0, OVERDUE: 0, CRITICAL: 0 },
        }],
      },
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: vi.fn(),
      fetchNextPage: vi.fn(),
    }));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('sends attention and search filters to the Kanban query', async () => {
    renderSection();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Vencida/i }));
    await user.type(screen.getByRole('searchbox'), 'Tech');

    await waitFor(() => expect(useOpportunities).toHaveBeenLastCalledWith({
      sellerId: 'seller-1',
      attentionStatus: 'OVERDUE',
      search: 'Tech',
    }));
  });

  it('moves a dragged opportunity when its transition is enabled', async () => {
    renderSection();
    const card = screen.getByText('Tech Alpha').closest('article');
    const target = screen.getByRole('heading', { name: 'Follow-up' }).closest('section');
    expect(card).not.toBeNull();
    expect(target).not.toBeNull();

    fireEvent.dragStart(card!);
    fireEvent.drop(target!);

    await waitFor(() => expect(mutate).toHaveBeenCalledWith(
      { opportunityId: 'opportunity-1', stage: 'FOLLOW_UP', lossReason: undefined },
      expect.any(Object),
    ));
  });
});
