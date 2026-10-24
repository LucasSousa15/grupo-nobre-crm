import { CreateSellerProps, SellerProps, UpdateSellerProps } from '../types/seller';

export class Seller {
  private constructor(private readonly props: SellerProps) {}

  static create(input: CreateSellerProps): Seller {
    const now = new Date();
    return new Seller({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: SellerProps): Seller {
    return new Seller(props);
  }

  get data(): Readonly<SellerProps> {
    return { ...this.props };
  }

  update(input: UpdateSellerProps): void {
    if (input.name !== undefined) this.props.name = input.name.trim();
    if (input.email !== undefined) this.props.email = input.email.trim().toLowerCase();
    if (input.active !== undefined) this.props.active = input.active;
    this.props.updatedAt = new Date();
  }
}
