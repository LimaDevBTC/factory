import { cookies } from 'next/headers';
import type { Locale, Tenant } from '@/lib/supabase/types';
import itMessages from '@/messages/it.json';
import enMessages from '@/messages/en.json';
import deMessages from '@/messages/de.json';

export const SITE_LOCALE_COOKIE = 'factory-locale';
const SUPPORTED_FOR_SITE: Locale[] = ['it', 'en', 'de'];

export type Messages = typeof itMessages;

const DICTS: Partial<Record<Locale, Messages>> = {
  it: itMessages,
  en: enMessages,
  de: deMessages as Messages,
};

/**
 * Pick the locale to render the public site in.
 * Order: cookie (if allowed by tenant.enabled_locales) → tenant.default_locale →
 * 'it' fallback.
 */
export function resolveSiteLocale(tenant: Pick<Tenant, 'default_locale' | 'enabled_locales'>): Locale {
  const allowed = tenant.enabled_locales.length
    ? tenant.enabled_locales.filter((l) => SUPPORTED_FOR_SITE.includes(l))
    : (['it'] as Locale[]);

  const fromCookie = cookies().get(SITE_LOCALE_COOKIE)?.value as Locale | undefined;
  if (fromCookie && allowed.includes(fromCookie)) return fromCookie;

  if (allowed.includes(tenant.default_locale)) return tenant.default_locale;
  return allowed[0] ?? 'it';
}

export function getMessages(locale: Locale): Messages {
  return DICTS[locale] ?? itMessages;
}

type DotPaths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? DotPaths<T[K], `${P}${K}.`>
    : `${P}${K}`;
}[keyof T & string];

export type MessageKey = DotPaths<Messages>;

export type TFn = (key: MessageKey, fallback?: string) => string;

export function createT(messages: Messages): TFn {
  return (key, fallback) => {
    const parts = key.split('.');
    let cur: unknown = messages;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return fallback ?? key;
      }
    }
    return typeof cur === 'string' ? cur : (fallback ?? key);
  };
}

/**
 * Pick a locale-suffixed field from a row (item, tenant, ...).
 * Falls back through enabled locales then to 'it'.
 */
export function localized<R extends Record<string, unknown>, K extends string>(
  row: R,
  base: K,
  locale: Locale,
  enabledLocales: Locale[],
): string | null {
  const order: Locale[] = [locale, ...enabledLocales.filter((l) => l !== locale), 'it' as Locale];
  for (const l of order) {
    const k = `${base}_${l}` as keyof R;
    const v = row[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return null;
}

export function localeFromTenant(tenant: Pick<Tenant, 'default_locale' | 'enabled_locales'>): Locale[] {
  return tenant.enabled_locales.filter((l) => SUPPORTED_FOR_SITE.includes(l));
}

export function siteSupportedLocales(): Locale[] {
  return [...SUPPORTED_FOR_SITE];
}
