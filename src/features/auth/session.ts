import type { QueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '@/lib/api-client';

/** The bits of a data router the session needs (browser and memory routers both fit). */
export interface SessionRouter {
  state: { location: { pathname: string; search: string } };
  navigate: (to: string, options?: { replace?: boolean }) => unknown;
}

/** `/login?next=…`; `expired` adds the "session expired" notice. */
export function loginPath(next: string, expired: boolean): string {
  const params = new URLSearchParams();
  if (expired) params.set('expired', '1');
  if (next !== '/' && next !== '') params.set('next', next);
  const query = params.toString();
  return query ? `/login?${query}` : '/login';
}

/** Only same-app paths, so `next` can't send the operator to another site. */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) {
    return '/';
  }
  return next;
}

/** On any 401: drop cached data and go to login, coming back to the same page afterwards. */
export function connectSession(router: SessionRouter, queryClient: QueryClient): void {
  setUnauthorizedHandler(() => {
    queryClient.clear();
    const { pathname, search } = router.state.location;
    if (pathname === '/login') return;
    void router.navigate(loginPath(pathname + search, true), { replace: true });
  });
}
