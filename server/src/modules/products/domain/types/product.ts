export interface ProductProps {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductProps {
  name: string;
  description?: string;
}

export interface UpdateProductProps {
  name?: string;
  description?: string | null;
  active?: boolean;
}
