export interface ProductProps {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductProps {
  name: string;
  description?: string;
  unitPrice: number;
}

export interface UpdateProductProps {
  name?: string;
  description?: string | null;
  unitPrice?: number;
  active?: boolean;
}
