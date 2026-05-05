'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const DIETARY_KEYS = ['vegetariano', 'vegano', 'senza_glutine', 'senza_lattosio'] as const;

type Labels = {
  dietary: string;
  vegetariano: string;
  vegano: string;
  senza_glutine: string;
  senza_lattosio: string;
};

export function MenuFilters({ labels }: { labels: Labels }) {
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
      <p className="sr-only">{labels.dietary}</p>
      <div className="flex flex-wrap gap-2">
        {DIETARY_KEYS.map((key) => {
          const active = dietary.has(key);
          return (
            <button
              key={key}
              type="button"
              disabled={pending}
              onClick={() => toggle(key)}
              aria-pressed={active}
              className={
                'rounded-full border px-3 py-1 text-xs transition ' +
                (active
                  ? 'tenant-bg-primary border-transparent'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary')
              }
            >
              {labels[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
