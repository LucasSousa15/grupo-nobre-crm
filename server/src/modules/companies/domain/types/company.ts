export interface CompanyProps {
  id: string;
  code: string;
  companyName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyProps {
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateCompanyProps {
  companyName?: string;
  contactName?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}
