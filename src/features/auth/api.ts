import { z } from 'zod';
import { apiRequest } from '@/lib/api-client';
import { isoDateTime } from '@/lib/schemas';

const adminSchema = z.object({ username: z.string() });

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: isoDateTime,
  admin: adminSchema,
});
export const meResponseSchema = z.object({ admin: adminSchema });

export type Admin = z.infer<typeof adminSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** The login form's own checks, so a bad body never reaches the server. */
export const loginFormSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  totp: z.string().regex(/^\d{6}$/),
});
export type LoginInput = z.infer<typeof loginFormSchema>;

export function login(input: LoginInput): Promise<LoginResponse> {
  return apiRequest('/auth/login', loginResponseSchema, {
    method: 'POST',
    body: input,
    auth: false,
  });
}

export function fetchMe(): Promise<Admin> {
  return apiRequest('/auth/me', meResponseSchema).then((body) => body.admin);
}

export const meQueryKey = ['auth', 'me'] as const;
