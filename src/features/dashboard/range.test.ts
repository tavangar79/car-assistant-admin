import { describe, expect, it } from 'vitest';
import { addDays, presetRange, todayInTehran } from './range';

describe('dashboard ranges', () => {
  it('uses the Tehran calendar day', () => {
    // 21:00 UTC on Nov 5 is already Nov 6 in Tehran.
    expect(todayInTehran(new Date('2026-11-05T21:00:00.000Z'))).toBe('2026-11-06');
    expect(todayInTehran(new Date('2026-11-05T20:00:00.000Z'))).toBe('2026-11-05');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it.each([
    ['7d', '2026-10-31'],
    ['30d', '2026-10-08'],
    ['90d', '2026-08-09'],
    ['12m', '2025-11-07'],
  ] as const)('%s ends today and starts on %s (inclusive)', (preset, from) => {
    expect(presetRange(preset, '2026-11-06')).toEqual({ from, to: '2026-11-06' });
  });

  it('keeps 12 months within the 366-day limit in a leap year', () => {
    const { from, to } = presetRange('12m', '2028-03-01');
    const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
    expect(from).toBe('2027-03-02');
    expect(days).toBeLessThanOrEqual(366);
  });
});
