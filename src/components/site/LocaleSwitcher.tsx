'use client';

import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import type { Locale } from '@/lib/supabase/types';
import { setLocaleAction } from '@/app/sites/[slug]/actions';

const LABEL: Record<Locale, string> = {
  it: 'IT', en: 'EN', de: 'DE',
  fr: 'FR', es: 'ES', pt: 'PT',
  zh: 'ZH', ar: 'AR', hi: 'HI',
  pa: 'PA', ro: 'RO', ru: 'RU', uk: 'UK', tr: 'TR', ja: 'JA', ko: 'KO',
  sq: 'SQ', bn: 'BN', am: 'AM', tl: 'TL', vi: 'VI', ur: 'UR',
};

export function LocaleSwitcher({
  current,
  available,
}: {
  current: Locale;
  available: Locale[];
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  if (available.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 text-xs">
      {available.map((loc) => (
        <button
          key={loc}
          type="button"
          disabled={pending || loc === current}
          onClick={() => startTransition(() => setLocaleAction(loc, pathname))}
          className={
            'rounded px-2 py-1 transition ' +
            (loc === current
              ? 'bg-foreground/10 text-foreground'
              : 'text-muted-foreground hover:bg-foreground/5')
          }
        >
          {LABEL[loc] ?? loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
