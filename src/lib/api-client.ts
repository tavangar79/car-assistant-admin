import type { z } from 'zod';
import type { TranslationKey } from '@/i18n';
import { clearToken, readToken } from './token';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
const ADMIN_PREFIX = '/api/admin';

/** `http`: the server answered with an error status. `network`: no answer. `invalid_response`: the body broke the contract. */
export type ApiErrorKind = 'http' | 'network' | 'invalid_response';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly details: unknown;

  constructor(kind: ApiErrorKind, status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }

  /** `details.code`, when the server sent one (for example `user_blocked`). */
  get code(): string | undefined {
    const details = this.details;
    if (details && typeof details === 'object' && 'code' in details) {
      return typeof details.code === 'string' ? details.code : undefined;
    }
    return undefined;
  }

  /** Field messages from a 400 body: `details: { field: ["…"] }`. */
  get fieldErrors(): Record<string, string[]> {
    const details = this.details;
    if (!details || typeof details !== 'object') return {};
    const result: Record<string, string[]> = {};
    for (const [field, messages] of Object.entries(details)) {
      if (Array.isArray(messages)) result[field] = messages.map(String);
    }
    return result;
  }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  return error instanceof ApiError && (status === undefined || error.status === status);
}

/** Reads `{ error: { message, details? } }`. Anything else falls back to the status text. */
export async function parseErrorBody(
  response: Response,
): Promise<{ message: string; details?: unknown }> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'error' in body) {
      const error = body.error;
      if (error && typeof error === 'object' && 'message' in error) {
        return {
          message: String(error.message),
          details: 'details' in error ? error.details : undefined,
        };
      }
    }
  } catch {
    // Not JSON: use the status text below.
  }
  return { message: response.statusText || `HTTP ${response.status}` };
}

/** Maps an error to a UI string key by status and kind. It never looks at the message text. */
export function errorMessageKey(error: unknown): TranslationKey {
  if (!(error instanceof ApiError)) return 'errors.generic';
  if (error.kind === 'network') return 'errors.network';
  if (error.kind === 'invalid_response') return 'errors.invalidResponse';
  switch (error.status) {
    case 400:
      return 'errors.validation';
    case 401:
      return 'errors.sessionExpired';
    case 403:
      return 'errors.forbidden';
    case 404:
      return 'errors.notFound';
    case 409:
      return 'errors.conflict';
    case 422:
      return 'errors.unprocessable';
    case 429:
      return 'errors.tooManyRequests';
    default:
      return 'errors.generic';
  }
}

let onUnauthorized: () => void = () => {};

/** Called after a 401 on an authenticated request, once the token is cleared. */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | null | undefined>;
  /** Send the Bearer token and treat 401 as "session expired". Only login turns it off. */
  auth?: boolean;
}

export function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${ADMIN_PREFIX}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = 'GET', body, query, auth = true } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? readToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new ApiError('network', 0, cause instanceof Error ? cause.message : 'Network error');
  }

  if (!response.ok) {
    const { message, details } = await parseErrorBody(response);
    if (response.status === 401 && auth) {
      clearToken();
      onUnauthorized();
    }
    throw new ApiError('http', response.status, message, details);
  }
  return response;
}

/** Sends a request and checks the JSON body against `schema`, so contract drift fails loudly. */
export async function apiRequest<S extends z.ZodType>(
  path: string,
  schema: S,
  options: RequestOptions = {},
): Promise<z.infer<S>> {
  const response = await send(path, options);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('invalid_response', response.status, 'Response is not JSON');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      'invalid_response',
      response.status,
      parsed.error.message,
      parsed.error.issues,
    );
  }
  return parsed.data;
}

/** For responses without a body (204). */
export async function apiSend(path: string, options: RequestOptions = {}): Promise<void> {
  await send(path, options);
}
