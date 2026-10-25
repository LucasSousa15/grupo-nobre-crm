import { z } from 'zod';

export const contactUpdateSchema = z
  .object({
    lastContactAt: z.string().datetime().optional(),
    nextFollowUpAt: z.string().datetime().optional(),
  })
  .refine(
    (payload) => payload.lastContactAt !== undefined || payload.nextFollowUpAt !== undefined,
    'Informe a data do contato ou do próximo follow-up.',
  );

export type ContactUpdate = z.infer<typeof contactUpdateSchema>;
