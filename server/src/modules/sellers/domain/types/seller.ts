export interface SellerProps {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSellerProps {
  name: string;
  email: string;
}

export interface UpdateSellerProps {
  name?: string;
  email?: string;
  active?: boolean;
}
