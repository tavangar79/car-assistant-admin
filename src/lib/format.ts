import { LOCALE } from '@/i18n';

/** Dates in the panel are shown in the backend's business time zone. */
export const TIME_ZONE = 'Asia/Tehran';

const OBJECT_ID = /^[0-9a-f]{24}$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID.test(value);
export const isDateOnly = (value: unknown): value is string =>
  typeof value === 'string' && DATE_ONLY.test(value);
export const isIsoDateTime = (value: unknown): value is string =>
  typeof value === 'string' && ISO_DATE_TIME.test(value);

const numberFormat = new Intl.NumberFormat(LOCALE);
const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TIME_ZONE,
});

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** A date-only value (`YYYY-MM-DD`): a calendar day, so no time zone shift. */
export function formatDate(value: string): string {
  return dateFormat.format(new Date(`${value}T00:00:00Z`));
}

/** An ISO-8601 instant, shown in Tehran time. */
export function formatDateTime(value: string): string {
  return dateTimeFormat.format(new Date(value));
}

/** `65f1a2b3c4d5e6f7a8b9c0d1` → `65f1…c0d1`. */
export function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}

const MAX_JSON_LENGTH = 60;

/** Nested objects and arrays as one short line of JSON. */
export function compactJson(value: unknown): string {
  const json = JSON.stringify(value) ?? '';
  return json.length > MAX_JSON_LENGTH ? `${json.slice(0, MAX_JSON_LENGTH - 1)}…` : json;
}

export type CellValue =
  | { kind: 'empty' }
  | { kind: 'id'; id: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'number'; text: string }
  | { kind: 'date'; text: string; raw: string }
  | { kind: 'json'; text: string; full: string }
  | { kind: 'text'; text: string };

/** Decides how a value from the collection browser is shown. Pure, so the table stays dumb. */
export function describeCell(value: unknown): CellValue {
  if (value === null || value === undefined || value === '') return { kind: 'empty' };
  if (typeof value === 'boolean') return { kind: 'boolean', value };
  if (typeof value === 'number') return { kind: 'number', text: formatNumber(value) };
  if (isObjectId(value)) return { kind: 'id', id: value };
  if (isIsoDateTime(value)) return { kind: 'date', text: formatDateTime(value), raw: value };
  if (isDateOnly(value)) return { kind: 'date', text: formatDate(value), raw: value };
  if (typeof value === 'object') {
    return { kind: 'json', text: compactJson(value), full: JSON.stringify(value, null, 2) };
  }
  return { kind: 'text', text: String(value) };
}

/** `firstName lastName`, trimmed; null when both are empty. */
export function fullName(person: {
  firstName: string | null;
  lastName: string | null;
}): string | null {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return name === '' ? null : name;
}
