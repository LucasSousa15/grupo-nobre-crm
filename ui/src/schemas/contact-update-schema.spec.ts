import { describe, expect, it } from 'vitest';
import { contactUpdateSchema } from './contact-update-schema';

describe('contactUpdateSchema', () => {
  it('rejects an empty contact update', () => {
    expect(contactUpdateSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a contact date or a next follow-up date', () => {
    expect(contactUpdateSchema.safeParse({ lastContactAt: '2026-10-25T15:00:00.000Z' }).success).toBe(true);
    expect(contactUpdateSchema.safeParse({ nextFollowUpAt: '2026-10-26T15:00:00.000Z' }).success).toBe(true);
  });
});
