import { describe, expect, it } from 'vitest';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';
import { ProductHasOpportunityItemsError } from 'src/modules/products/application/errors/product-has-opportunity-items.error';
import { CreateProductUseCase } from 'src/modules/products/application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from 'src/modules/products/application/use-cases/delete-product.use-case';
import { FindProductUseCase } from 'src/modules/products/application/use-cases/find-product.use-case';
import { UpdateProductUseCase } from 'src/modules/products/application/use-cases/update-product.use-case';
import { ProductProps } from 'src/modules/products/domain/types/product';
import { InMemoryProductRepository } from '../repositories/in-memory-product.repository';

const product = (overrides: Partial<ProductProps> = {}): ProductProps => ({
  id: 'product-id',
  name: 'Caneca personalizada',
  description: 'Caneca de cerâmica.',
  active: true,
  unitPrice: 15,
  createdAt: new Date('2026-10-15T12:00:00.000Z'),
  updatedAt: new Date('2026-10-15T12:00:00.000Z'),
  ...overrides,
});

describe('Product use cases', () => {
  it('creates an active product with an optional description', async () => {
    const repository = new InMemoryProductRepository();
    const created = await new CreateProductUseCase(repository).execute({ name: ' Caneca personalizada ', description: ' Cerâmica ', unitPrice: 15 });
    expect(created).toMatchObject({ name: 'Caneca personalizada', description: 'Cerâmica', unitPrice: 15, active: true });
  });

  it('lists products alphabetically', async () => {
    const repository = new InMemoryProductRepository([product({ id: 'squeeze', name: 'Squeeze personalizado' }), product({ id: 'caneca' })]);
    const products = await new FindProductUseCase(repository).all();
    expect(products.map((item) => item.name)).toEqual(['Caneca personalizada', 'Squeeze personalizado']);
  });

  it('updates product details and supports deactivation', async () => {
    const repository = new InMemoryProductRepository([product()]);
    const updated = await new UpdateProductUseCase(repository).execute('product-id', { description: null, active: false });
    expect(updated).toMatchObject({ description: null, active: false });
  });

  it('does not update a product that does not exist', async () => {
    const useCase = new UpdateProductUseCase(new InMemoryProductRepository());
    await expect(useCase.execute('missing', { active: false })).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('does not delete a product used by opportunity items', async () => {
    const repository = new InMemoryProductRepository([product()]);
    repository.opportunityItemProductIds.add('product-id');
    await expect(new DeleteProductUseCase(repository).execute('product-id')).rejects.toBeInstanceOf(ProductHasOpportunityItemsError);
  });

  it('deletes a product that has no opportunity items', async () => {
    const repository = new InMemoryProductRepository([product()]);
    await new DeleteProductUseCase(repository).execute('product-id');
    expect(repository.products).toHaveLength(0);
  });
});
