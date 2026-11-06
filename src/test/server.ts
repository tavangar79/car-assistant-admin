import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { API_BASE_URL } from '@/lib/api-client';
import * as fixtures from './fixtures';

/** Full URL of an admin route, for MSW handlers. */
export const api = (path: string) => `${API_BASE_URL}/api/admin${path}`;

export const errorBody = (message: string, details?: unknown) =>
  ({ error: details === undefined ? { message } : { message, details } }) as const;

/** Default handlers: a signed-in admin and contract-shaped data. Tests override with `server.use`. */
export const handlers = [
  http.get(api('/auth/me'), () => HttpResponse.json({ admin: { username: 'operator' } })),
  http.get(api('/stats'), ({ request }) => {
    const url = new URL(request.url);
    const bucket = (url.searchParams.get('bucket') ?? 'day') as 'day' | 'week' | 'month';
    return HttpResponse.json(
      fixtures.stats(
        url.searchParams.get('from') ?? '2026-10-08',
        url.searchParams.get('to') ?? '2026-11-06',
        bucket,
      ),
    );
  }),
  http.get(api('/users'), () =>
    HttpResponse.json({ users: [fixtures.adminUser()], nextCursor: null }),
  ),
  http.get(api('/users/:id'), () => HttpResponse.json(fixtures.userDetail())),
  http.get(api('/collections/:name'), ({ params }) =>
    HttpResponse.json({ name: params.name, fields: ['id'], documents: [], nextCursor: null }),
  ),
  http.get(api('/vehicle-catalog'), () => HttpResponse.json(fixtures.vehicleCatalog)),
  http.get(api('/service-items'), () => HttpResponse.json({ items: fixtures.serviceItems })),
  http.get(api('/intervals'), () => HttpResponse.json({ intervals: fixtures.intervals })),
];

export const server = setupServer(...handlers);
