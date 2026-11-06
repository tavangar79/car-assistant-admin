import { en } from './en';

export type TranslationKey = keyof typeof en;
type Params = Record<string, string | number>;

/** The UI locale. Formatters use it too, so switching languages later is one change. */
export const LOCALE = 'en-US';

/** Looks up a UI string and fills `{name}` placeholders from `params`. */
export function t(key: TranslationKey, params?: Params): string {
  const text: string = en[key];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
