import { z } from "zod";

const sellerSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const sellersResponseSchema = z.object({
  sellers: z.array(sellerSchema),
});
