import { describe, expect, it } from 'vitest';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { SellerEmailAlreadyUsedError } from 'src/modules/sellers/application/errors/seller-email-already-used.error';
import { SellerHasOpportunitiesError } from 'src/modules/sellers/application/errors/seller-has-opportunities.error';
import { CreateSellerUseCase } from 'src/modules/sellers/application/use-cases/create-seller.use-case';
import { DeleteSellerUseCase } from 'src/modules/sellers/application/use-cases/delete-seller.use-case';
import { FindSellerUseCase } from 'src/modules/sellers/application/use-cases/find-seller.use-case';
import { UpdateSellerUseCase } from 'src/modules/sellers/application/use-cases/update-seller.use-case';
import { SellerProps } from 'src/modules/sellers/domain/types/seller';
import { InMemorySellerRepository } from '../repositories/in-memory-seller.repository';

const seller = (overrides: Partial<SellerProps> = {}): SellerProps => ({
  id: 'seller-id',
  name: 'Ana Martins',
  email: 'ana@nobrebrindes.com.br',
  phone: '+55 11 99999-9999',
  active: true,
  createdAt: new Date('2026-10-15T12:00:00.000Z'),
  updatedAt: new Date('2026-10-15T12:00:00.000Z'),
  ...overrides,
});

describe('Seller use cases', () => {
  it('creates an active seller and normalizes the e-mail', async () => {
    const repository = new InMemorySellerRepository();
    const created = await new CreateSellerUseCase(repository).execute({ name: ' Ana Martins ', email: ' ANA@NOBREBRINDES.COM.BR ' });

    expect(created).toMatchObject({ name: 'Ana Martins', email: 'ana@nobrebrindes.com.br', phone: null, active: true });
    expect(repository.sellers).toHaveLength(1);
  });

  it('does not create sellers with a duplicate e-mail', async () => {
    const useCase = new CreateSellerUseCase(new InMemorySellerRepository([seller()]));
    await expect(useCase.execute({ name: 'Outra Ana', email: 'ANA@nobrebrindes.com.br' })).rejects.toBeInstanceOf(SellerEmailAlreadyUsedError);
  });

  it('lists sellers alphabetically', async () => {
    const repository = new InMemorySellerRepository([seller({ id: 'bruno', name: 'Bruno Lima' }), seller({ id: 'ana', name: 'Ana Martins' })]);
    const sellers = await new FindSellerUseCase(repository).all();
    expect(sellers.map((item) => item.name)).toEqual(['Ana Martins', 'Bruno Lima']);
  });

  it('updates seller data and permits deactivation without removing history', async () => {
    const repository = new InMemorySellerRepository([seller()]);
    const updated = await new UpdateSellerUseCase(repository).execute('seller-id', { name: 'Ana Costa', phone: null, active: false });
    expect(updated).toMatchObject({ name: 'Ana Costa', phone: null, active: false });
  });

  it('does not update a seller to an e-mail that belongs to another seller', async () => {
    const repository = new InMemorySellerRepository([seller(), seller({ id: 'bruno', email: 'bruno@nobrebrindes.com.br' })]);
    await expect(new UpdateSellerUseCase(repository).execute('seller-id', { email: 'bruno@nobrebrindes.com.br' })).rejects.toBeInstanceOf(SellerEmailAlreadyUsedError);
  });

  it('does not delete a seller with opportunities', async () => {
    const repository = new InMemorySellerRepository([seller()]);
    repository.opportunitySellerIds.add('seller-id');
    await expect(new DeleteSellerUseCase(repository).execute('seller-id')).rejects.toBeInstanceOf(SellerHasOpportunitiesError);
  });

  it('deletes a seller without opportunities and reports absent sellers', async () => {
    const repository = new InMemorySellerRepository([seller()]);
    const useCase = new DeleteSellerUseCase(repository);
    await useCase.execute('seller-id');
    expect(repository.sellers).toHaveLength(0);
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
