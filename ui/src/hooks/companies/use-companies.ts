'use client';
import { useQuery } from '@tanstack/react-query';
import { crmApi } from '@/http/api';
import { z } from 'zod';

const schema = z.object({ companies: z.array(z.object({ id: z.string(), companyName: z.string(), contactName: z.string(), contactEmail: z.string().nullable(), contactPhone: z.string().nullable() })) });
export type Company = z.infer<typeof schema>['companies'][number];
export function useCompanies() { return useQuery({ queryKey: ['companies'], queryFn: async () => schema.parse((await crmApi.get('/companies')).data).companies }); }
