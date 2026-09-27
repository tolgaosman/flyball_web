export const locales = ['en', 'tr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** Explicit choice from the EN/TR toggle; without it the browser language decides. */
export const LOCALE_COOKIE = 'flyball.locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Turkish browser → Turkish, anything else → English (same rule as the Flutter app). */
export function localeFromAcceptLanguage(header: string | null): Locale {
  const first = header?.split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('tr') ? 'tr' : defaultLocale;
}
