import { TIME_ZONE } from '@/lib/format';

export type Bucket = 'day' | 'week' | 'month';
export type RangePreset = '7d' | '30d' | '90d' | '12m';

export const RANGE_PRESETS: RangePreset[] = ['7d', '30d', '90d', '12m'];
export const BUCKETS: Bucket[] = ['day', 'week', 'month'];

/** A bucket that keeps each preset's chart readable. The operator can still pick another. */
export const DEFAULT_BUCKET: Record<RangePreset, Bucket> = {
  '7d': 'day',
  '30d': 'day',
  '90d': 'week',
  '12m': 'month',
};

/** Today's calendar date in Tehran as `YYYY-MM-DD` (the stats endpoint counts Tehran days). */
export function todayInTehran(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now);
}

function toDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, days: number): string {
  const date = toDate(day);
  date.setUTCDate(date.getUTCDate() + days);
  return toDay(date);
}

/**
 * The inclusive `from`/`to` range for a preset that ends on `today`.
 * "12 months" starts the day after the same date last year, so it spans 365 or 366 days (the API's limit).
 */
export function presetRange(preset: RangePreset, today: string): { from: string; to: string } {
  switch (preset) {
    case '7d':
      return { from: addDays(today, -6), to: today };
    case '30d':
      return { from: addDays(today, -29), to: today };
    case '90d':
      return { from: addDays(today, -89), to: today };
    case '12m': {
      const date = toDate(today);
      date.setUTCFullYear(date.getUTCFullYear() - 1);
      return { from: addDays(toDay(date), 1), to: today };
    }
  }
}
