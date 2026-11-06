import { useQuery } from '@tanstack/react-query';
import { fetchMe, meQueryKey } from './api';

/** The signed-in admin. Pass `enabled: false` when there is no token, so no request is sent. */
export function useMe({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: meQueryKey, queryFn: fetchMe, staleTime: 5 * 60_000, enabled });
}
