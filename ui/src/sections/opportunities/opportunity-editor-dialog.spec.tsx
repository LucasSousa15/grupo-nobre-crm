import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpportunityEditorDialog } from './opportunity-editor-dialog';
import { ToastProvider } from '@/components/toast-provider';

const api = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));
vi.mock('@/http/api', () => ({ crmApi: api }));
vi.mock('@/hooks/companies/use-companies', () => ({
  useCompanies: () => ({ data: [{ id: '00000000-0000-4000-8000-000000000001', code: 'ACME', companyName: 'Acme', contactName: 'Ana', contactEmail: null, contactPhone: null }] }),
}));
vi.mock('@/hooks/products/use-products', () => ({
  useProducts: () => ({ data: [{ id: '00000000-0000-4000-9000-000000000001', name: 'Caneca', unitPrice: 10, active: true }] }),
}));

const seller = { id: '00000000-0000-4000-8000-000000000010', name: 'Ana', email: 'ana@nobre.local', phone: null, active: true, createdAt: '2026-10-25T12:00:00.000Z', updatedAt: '2026-10-25T12:00:00.000Z' };
const renderDialog = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><OpportunityEditorDialog seller={seller} onClose={vi.fn()} /><ToastProvider /></QueryClientProvider>);

describe('OpportunityEditorDialog', () => {
  afterEach(() => { document.body.innerHTML = ''; });
  beforeEach(() => { api.post.mockReset(); api.patch.mockReset(); });

  it('shows validation feedback before creating an invalid opportunity', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: 'Salvar oportunidade' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Revise os campos destacados');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows an opportunity code preview that is independent from the selected company', async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByLabelText('Código')).toHaveValue('Será gerado automaticamente (OPP-0000)');
    await user.selectOptions(screen.getAllByRole('combobox')[0], '00000000-0000-4000-8000-000000000001');
    expect(screen.getByLabelText('Código')).toHaveValue('Será gerado automaticamente (OPP-0000)');
  });

  it('sends a validated creation payload', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: {} });
    renderDialog();
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], '00000000-0000-4000-8000-000000000001');
    fireEvent.change(screen.getByLabelText('Evento'), { target: { value: '2026-12-30' } });
    await user.selectOptions(selects[1], '00000000-0000-4000-9000-000000000001');
    await user.click(screen.getByRole('button', { name: 'Salvar oportunidade' }));
    expect(api.post).toHaveBeenCalledWith('/opportunities', expect.objectContaining({ sellerId: seller.id, items: [{ productId: '00000000-0000-4000-9000-000000000001', quantity: 1 }] }));
  });
});
