import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api-client';

/** Client errors (4xx) are final; only network and server errors are retried, once. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          failureCount < 1 && !(isApiError(error) && error.status >= 400 && error.status < 500),
      },
    },
  });
}
