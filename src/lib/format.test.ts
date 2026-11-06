import { describe, expect, it } from 'vitest';
import {
  compactJson,
  describeCell,
  formatDate,
  formatDateTime,
  formatNumber,
  fullName,
  shortId,
} from './format';

describe('formatters', () => {
  it('shortens long ids and keeps short ones', () => {
    expect(shortId('65f1a2b3c4d5e6f7a8b9c0d1')).toBe('65f1…c0d1');
    expect(shortId('abc')).toBe('abc');
  });

  it('formats numbers with grouping', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats a date-only value without a time zone shift', () => {
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026');
  });

  it('formats an instant in Tehran time', () => {
    // 21:00 UTC is 00:30 the next day in Tehran (UTC+03:30).
    expect(formatDateTime('2026-01-01T21:00:00.000Z')).toBe('Jan 2, 2026, 00:30');
  });

  it('truncates long JSON', () => {
    expect(compactJson({ a: 1 })).toBe('{"a":1}');
    const long = compactJson({ text: 'x'.repeat(100) });
    expect(long).toHaveLength(60);
    expect(long.endsWith('…')).toBe(true);
  });

  it('joins names and returns null when both are empty', () => {
    expect(fullName({ firstName: 'Sara', lastName: 'Ahmadi' })).toBe('Sara Ahmadi');
    expect(fullName({ firstName: 'Sara', lastName: null })).toBe('Sara');
    expect(fullName({ firstName: null, lastName: '' })).toBeNull();
  });
});

describe('describeCell', () => {
  it.each([
    [null, 'empty'],
    ['', 'empty'],
    [true, 'boolean'],
    [42, 'number'],
    ['65f1a2b3c4d5e6f7a8b9c0d1', 'id'],
    ['2026-11-06T10:00:00.000Z', 'date'],
    ['2026-11-06', 'date'],
    [{ letters: 'ب', number: 12 }, 'json'],
    [['a', 'b'], 'json'],
    ['سلام', 'text'],
  ])('%j is shown as %s', (value, kind) => {
    expect(describeCell(value).kind).toBe(kind);
  });
});
