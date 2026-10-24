'use client';
import { useQuery } from '@tanstack/react-query';
import { crmApi } from '@/http/api';
import { z } from 'zod';
const schema = z.object({ products: z.array(z.object({ id: z.string(), name: z.string(), active: z.boolean() })) });
export type Product = z.infer<typeof schema>['products'][number];
export function useProducts() { return useQuery({ queryKey: ['products'], queryFn: async () => schema.parse((await crmApi.get('/products')).data).products.filter((product) => product.active) }); }
