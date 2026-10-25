import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Opportunity } from '@/hooks/opportunities/types';
import { ToastProvider } from '@/components/toast-provider';
import { OpportunityFollowUpPanel } from './opportunity-follow-up-panel';

const api = vi.hoisted(() => ({ patch: vi.fn() }));
const remindersQuery = vi.hoisted(() => ({ data: [] as unknown[], isLoading: false, isError: false }));

vi.mock('@/http/api', () => ({ crmApi: api }));
vi.mock('@/hooks/opportunities/use-opportunity-reminders', () => ({
  useOpportunityReminders: () => remindersQuery,
}));

const opportunity: Opportunity = {
  id: 'opportunity-1',
  code: 'OPP-2001',
  stage: 'FOLLOW_UP',
  attentionStatus: 'OVERDUE',
  estimatedValue: 4500,
  lastContactAt: '2026-10-20T12:00:00.000Z',
  nextFollowUpAt: null,
  proposalValidUntil: '2026-11-29T00:00:00.000Z',
  customerEventAt: '2026-11-30T00:00:00.000Z',
  lossReason: null,
  transitionOptions: [],
  company: { id: 'company-1', name: 'Tech Alpha', contactName: 'Mariana', contactEmail: null, contactPhone: null },
  seller: { id: 'seller-1', name: 'Ana' },
  items: [{ id: 'item-1', productId: 'product-1', productName: 'Caneca', quantity: 300 }],
  createdAt: '2026-10-10T12:00:00.000Z',
  updatedAt: '2026-10-20T12:00:00.000Z',
};

function renderPanel(onUpdated = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  render(
    <QueryClientProvider client={queryClient}>
      <OpportunityFollowUpPanel opportunity={opportunity} onUpdated={onUpdated} />
      <ToastProvider />
    </QueryClientProvider>,
  );
  return { invalidateQueries, onUpdated };
}

describe('OpportunityFollowUpPanel', () => {
  beforeEach(() => {
    api.patch.mockReset();
    remindersQuery.data = [];
    remindersQuery.isLoading = false;
    remindersQuery.isError = false;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('registers a contact and refreshes the opportunity and its reminders', async () => {
    const { invalidateQueries, onUpdated } = renderPanel();
    api.patch.mockResolvedValue({ data: { opportunity } });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Registrar contato agora' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/opportunities/opportunity-1',
      expect.objectContaining({ lastContactAt: expect.any(String) }),
    ));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(opportunity));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['opportunities'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['opportunities', 'opportunity-1', 'reminders'] });
  });

  it('schedules a follow-up using an ISO timestamp', async () => {
    renderPanel();
    api.patch.mockResolvedValue({ data: { opportunity } });
    const value = '2026-12-30T10:30';

    fireEvent.change(screen.getByLabelText('Agendar próximo follow-up'), { target: { value } });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Agendar' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/opportunities/opportunity-1', {
      nextFollowUpAt: new Date(value).toISOString(),
    }));
  });

  it('concludes an open reminder', async () => {
    remindersQuery.data = [{
      id: 'reminder-1',
      opportunityId: opportunity.id,
      type: 'FOLLOW_UP_OVERDUE',
      status: 'OPEN',
      dueAt: '2026-10-21T12:00:00.000Z',
      createdAt: '2026-10-21T12:00:00.000Z',
    }];
    renderPanel();
    api.patch.mockResolvedValue({ data: {} });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Concluir' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/opportunities/opportunity-1/reminders/reminder-1/dismiss'));
  });

  it('shows a feedback message when a contact update fails', async () => {
    renderPanel();
    api.patch.mockRejectedValue(new Error('network unavailable'));

    await userEvent.setup().click(screen.getByRole('button', { name: 'Registrar contato agora' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível registrar o contato agora.');
  });

  it('shows loading and error states for reminders without hiding the follow-up actions', () => {
    remindersQuery.isLoading = true;
    const { rerender } = render(
      <QueryClientProvider client={new QueryClient()}>
        <OpportunityFollowUpPanel opportunity={opportunity} onUpdated={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Carregando lembretes...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar contato agora' })).toBeEnabled();

    remindersQuery.isLoading = false;
    remindersQuery.isError = true;
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <OpportunityFollowUpPanel opportunity={opportunity} onUpdated={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Não foi possível carregar os lembretes.')).toBeInTheDocument();
  });
});
