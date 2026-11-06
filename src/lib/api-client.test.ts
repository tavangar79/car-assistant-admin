import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { api, errorBody, server } from '@/test/server';
import {
  ApiError,
  apiRequest,
  buildUrl,
  errorMessageKey,
  parseErrorBody,
  setUnauthorizedHandler,
} from './api-client';
import { readToken, saveToken } from './token';

const schema = z.object({ ok: z.boolean() });

describe('errorMessageKey', () => {
  it.each([
    [400, 'errors.validation'],
    [401, 'errors.sessionExpired'],
    [403, 'errors.forbidden'],
    [404, 'errors.notFound'],
    [409, 'errors.conflict'],
    [422, 'errors.unprocessable'],
    [429, 'errors.tooManyRequests'],
    [500, 'errors.generic'],
  ])('maps HTTP %i to %s', (status, key) => {
    expect(errorMessageKey(new ApiError('http', status, 'any text'))).toBe(key);
  });

  it('maps network and contract failures, and unknown errors', () => {
    expect(errorMessageKey(new ApiError('network', 0, 'offline'))).toBe('errors.network');
    expect(errorMessageKey(new ApiError('invalid_response', 200, 'bad'))).toBe(
      'errors.invalidResponse',
    );
    expect(errorMessageKey(new Error('boom'))).toBe('errors.generic');
  });

  it('never depends on the message text', () => {
    expect(errorMessageKey(new ApiError('http', 404, 'Access denied'))).toBe('errors.notFound');
  });
});

describe('ApiError', () => {
  it('reads details.code and field errors', () => {
    expect(new ApiError('http', 403, 'x', { code: 'user_blocked' }).code).toBe('user_blocked');
    expect(new ApiError('http', 400, 'x').code).toBeUndefined();
    expect(
      new ApiError('http', 400, 'x', { scope: ['Unknown make'], code: 'c' }).fieldErrors,
    ).toEqual({ scope: ['Unknown make'] });
  });
});

describe('parseErrorBody', () => {
  it('reads the contract error body', async () => {
    const response = Response.json(errorBody('Invalid', { title: ['Required'] }), { status: 400 });
    expect(await parseErrorBody(response)).toEqual({
      message: 'Invalid',
      details: { title: ['Required'] },
    });
  });

  it('falls back to the status for other bodies', async () => {
    const response = new Response('<html>', { status: 502, statusText: 'Bad Gateway' });
    expect(await parseErrorBody(response)).toEqual({ message: 'Bad Gateway' });
  });
});

describe('buildUrl', () => {
  it('prefixes the admin path and drops empty query values', () => {
    expect(buildUrl('/users', { search: '', cursor: null, limit: 25, x: undefined })).toBe(
      'http://localhost:3000/api/admin/users?limit=25',
    );
  });
});

describe('apiRequest', () => {
  afterEach(() => setUnauthorizedHandler(() => {}));

  it('sends the bearer token and returns the parsed body', async () => {
    saveToken('abc', '2099-01-01T00:00:00.000Z');
    let auth: string | null = null;
    server.use(
      http.get(api('/ping'), ({ request }) => {
        auth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(apiRequest('/ping', schema)).resolves.toEqual({ ok: true });
    expect(auth).toBe('Bearer abc');
  });

  it('throws an ApiError with the parsed body on an error status', async () => {
    server.use(
      http.get(api('/ping'), () =>
        HttpResponse.json(errorBody('Nope', { code: 'x' }), { status: 409 }),
      ),
    );
    const error = await apiRequest('/ping', schema).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'http',
      status: 409,
      message: 'Nope',
      details: { code: 'x' },
    });
  });

  it('fails loudly when the body breaks the contract', async () => {
    server.use(http.get(api('/ping'), () => HttpResponse.json({ ok: 'yes' })));
    await expect(apiRequest('/ping', schema)).rejects.toMatchObject({ kind: 'invalid_response' });
  });

  it('reports a network failure', async () => {
    server.use(http.get(api('/ping'), () => HttpResponse.error()));
    await expect(apiRequest('/ping', schema)).rejects.toMatchObject({ kind: 'network', status: 0 });
  });

  it('on 401 clears the token and calls the unauthorized handler', async () => {
    saveToken('abc', '2099-01-01T00:00:00.000Z');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    server.use(
      http.get(api('/ping'), () => HttpResponse.json(errorBody('Unauthorized'), { status: 401 })),
    );
    await expect(apiRequest('/ping', schema)).rejects.toMatchObject({ status: 401 });
    expect(readToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not treat a 401 as an expired session when auth is off (login)', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    server.use(
      http.post(api('/auth/login'), () =>
        HttpResponse.json(errorBody('Invalid credentials'), { status: 401 }),
      ),
    );
    await expect(
      apiRequest('/auth/login', schema, { method: 'POST', body: {}, auth: false }),
    ).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('token', () => {
  it('treats an expired token as missing', () => {
    saveToken('abc', '2026-01-01T00:00:00.000Z');
    expect(readToken(new Date('2026-01-02T00:00:00.000Z'))).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});
