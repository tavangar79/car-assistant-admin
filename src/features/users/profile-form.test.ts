import { describe, expect, it } from 'vitest';
import { adminUser } from '@/test/fixtures';
import { createProfileFormSchema } from './api';
import { changedFields, initialProfileForm } from './profile-form';

describe('profile form', () => {
  const user = adminUser({ lastName: null });

  it('sends only changed, trimmed fields', () => {
    const form = { ...initialProfileForm(user), firstName: '  Mina ', lastName: 'Karimi' };
    expect(changedFields(user, form)).toEqual({ firstName: 'Mina', lastName: 'Karimi' });
    expect(changedFields(user, initialProfileForm(user))).toEqual({});
  });

  it('applies the profile field rules', () => {
    const schema = createProfileFormSchema('2026-11-06').partial();
    expect(schema.safeParse({ firstName: 'x'.repeat(50) }).success).toBe(true);
    expect(schema.safeParse({ firstName: 'x'.repeat(51) }).success).toBe(false);
    expect(schema.safeParse({ lastName: '' }).success).toBe(false);
    expect(schema.safeParse({ birthDate: '1899-12-31' }).success).toBe(false);
    expect(schema.safeParse({ birthDate: '2026-11-07' }).success).toBe(false);
    expect(schema.safeParse({ birthDate: '2026-02-30' }).success).toBe(false);
    expect(schema.safeParse({ birthDate: '2026-11-06' }).success).toBe(true);
  });
});
