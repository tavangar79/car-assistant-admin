import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/api-client';
import { isoDate } from '@/lib/schemas';
import type { Bucket } from './range';

const count = z.number().int().nonnegative();

export const statsSchema = z.object({
  range: z.object({ from: isoDate, to: isoDate, bucket: z.enum(['day', 'week', 'month']) }),
  totals: z.object({
    users: count,
    blockedUsers: count,
    vehicles: count,
    serviceVisits: count,
    fuelLogs: count,
    expenses: count,
    odometerReadings: count,
    documents: count,
  }),
  series: z.array(
    z.object({
      bucketStart: isoDate,
      users: count,
      vehicles: count,
      serviceVisits: count,
      fuelLogs: count,
      expenses: count,
      odometerReadings: count,
      documents: count,
    }),
  ),
});

export type Stats = z.infer<typeof statsSchema>;
export type StatsTotals = Stats['totals'];
export type StatsBucket = Stats['series'][number];
export type StatsQuery = { from: string; to: string; bucket: Bucket };

export function fetchStats(query: StatsQuery): Promise<Stats> {
  return apiRequest('/stats', statsSchema, { query });
}

export function useStats(query: StatsQuery) {
  return useQuery({
    queryKey: ['stats', query],
    queryFn: () => fetchStats(query),
    placeholderData: keepPreviousData,
  });
}
