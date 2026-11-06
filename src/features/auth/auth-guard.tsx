import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ErrorState } from '@/components/states';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/i18n';
import { isApiError } from '@/lib/api-client';
import { readToken } from '@/lib/token';
import { loginPath } from './session';
import { useMe } from './use-me';

/** Renders its children only for a signed-in admin, checked with `GET /auth/me`. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const hasToken = readToken() !== null;
  const me = useMe({ enabled: hasToken });
  const here = location.pathname + location.search;

  if (!hasToken) return <Navigate to={loginPath(here, false)} replace />;
  if (me.isPending) {
    return (
      <div
        className="flex min-h-svh items-center justify-center"
        role="status"
        aria-label={t('common.loading')}
      >
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }
  if (me.isError) {
    if (isApiError(me.error, 401)) return <Navigate to={loginPath(here, true)} replace />;
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <ErrorState error={me.error} onRetry={() => void me.refetch()} />
      </div>
    );
  }
  return children;
}
