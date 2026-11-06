import { useInfiniteQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/api-client';
import { nextCursor } from '@/lib/schemas';

/** `GET /collections/:name` (API-ADMIN.md), used read-only by the user detail record tabs. */
export const collectionPageSchema = z.object({
  name: z.string(),
  fields: z.array(z.string()),
  documents: z.array(z.record(z.string(), z.unknown())),
  nextCursor,
});

export type CollectionPage = z.infer<typeof collectionPageSchema>;
export type CollectionDocument = CollectionPage['documents'][number];

/** Only one of the two is sent. */
export type CollectionFilter = { userId?: string; vehicleId?: string };

export const PAGE_SIZE = 25;

export function fetchCollectionPage(
  name: string,
  { cursor, ...filter }: CollectionFilter & { cursor?: string | null },
): Promise<CollectionPage> {
  return apiRequest(`/collections/${encodeURIComponent(name)}`, collectionPageSchema, {
    query: { ...filter, cursor, limit: PAGE_SIZE },
  });
}

export function useCollectionPages(name: string, filter: CollectionFilter = {}) {
  return useInfiniteQuery({
    queryKey: ['collections', name, filter],
    queryFn: ({ pageParam }) => fetchCollectionPage(name, { ...filter, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
