import { CreateProductProps, ProductProps, UpdateProductProps } from '../types/product';

export class Product {
  private constructor(private readonly props: ProductProps) {}

  static create(input: CreateProductProps): Product {
    const now = new Date();
    return new Product({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: ProductProps): Product {
    return new Product(props);
  }

  get data(): Readonly<ProductProps> {
    return { ...this.props };
  }

  update(input: UpdateProductProps): void {
    if (input.name !== undefined) this.props.name = input.name.trim();
    if (input.description !== undefined) this.props.description = input.description?.trim() || null;
    if (input.active !== undefined) this.props.active = input.active;
    this.props.updatedAt = new Date();
  }
}
