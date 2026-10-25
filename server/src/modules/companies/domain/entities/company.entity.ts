import { CompanyProps, CreateCompanyProps, UpdateCompanyProps } from '../types/company';

export class Company {
  private constructor(private readonly props: CompanyProps) {}

  static create(input: CreateCompanyProps): Company {
    const now = new Date();
    return new Company({
      id: crypto.randomUUID(),
      code: input.companyName.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
      companyName: input.companyName.trim(),
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail?.trim().toLowerCase() || null,
      contactPhone: input.contactPhone?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: CompanyProps): Company {
    return new Company(props);
  }

  get data(): Readonly<CompanyProps> {
    return { ...this.props };
  }

  update(input: UpdateCompanyProps): void {
    if (input.companyName !== undefined) this.props.companyName = input.companyName.trim();
    if (input.contactName !== undefined) this.props.contactName = input.contactName.trim();
    if (input.contactEmail !== undefined) this.props.contactEmail = input.contactEmail?.trim().toLowerCase() || null;
    if (input.contactPhone !== undefined) this.props.contactPhone = input.contactPhone?.trim() || null;
    this.props.updatedAt = new Date();
  }
}
