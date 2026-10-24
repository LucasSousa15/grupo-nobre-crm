export interface SellerProps {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSellerProps {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateSellerProps {
  name?: string;
  email?: string;
  phone?: string | null;
  active?: boolean;
}
