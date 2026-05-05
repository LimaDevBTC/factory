'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { TFn } from '@/lib/i18n';

const DIETARY_OPTIONS = [
  { key: 'vegetariano', labelKey: 'filters.vegetarian' },
  { key: 'vegano', labelKey: 'filters.vegan' },
  { key: 'senza_glutine', labelKey: 'filters.gluten_free' },
  { key: 'senza_lattosio', labelKey: 'filters.lactose_free' },
] as const;

export function MenuFilters({ t }: { t: TFn }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const dietary = new Set((searchParams.get('d') ?? '').split(',').filter(Boolean));

  function toggle(key: string) {
    const next = new Set(dietary);
    if (next.has(key)) next.delete(key);
    else next.add(key);

    const params = new URLSearchParams(searchParams.toString());
    if (next.size === 0) params.delete('d');
    else params.set('d', Array.from(next).join(','));

    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  return (
    <div className="sticky top-[57px] z-20 -mx-4 mb-6 border-b border-border/60 bg-background/85 px-4 py-2 backdrop-blur">
      <p className="sr-only">{t('filters.dietary_label')}</p>
      <div className="flex flex-wrap gap-2">
        {DIETARY_OPTIONS.map((opt) => {
          const active = dietary.has(opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              disabled={pending}
              onClick={() => toggle(opt.key)}
              aria-pressed={active}
              className={
                'rounded-full border px-3 py-1 text-xs transition ' +
                (active
                  ? 'tenant-bg-primary border-transparent'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary')
              }
            >
              {t(opt.labelKey as 'filters.vegetarian')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
