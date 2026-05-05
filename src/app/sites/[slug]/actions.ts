'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { SITE_LOCALE_COOKIE } from '@/lib/i18n';
import type { Locale } from '@/lib/supabase/types';

const SUPPORTED: Locale[] = ['it', 'en', 'de'];

export async function setLocaleAction(locale: string, pathname: string) {
  if (!SUPPORTED.includes(locale as Locale)) return;
  cookies().set(SITE_LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath(pathname);
}
