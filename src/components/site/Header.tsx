import Link from 'next/link';
import type { Tenant, Locale } from '@/lib/supabase/types';
import type { TFn } from '@/lib/i18n';
import { VIBE_CONFIG } from '@/lib/verticals';
import { LocaleSwitcher } from './LocaleSwitcher';

export function Header({
  tenant,
  t,
  locale,
  availableLocales,
}: {
  tenant: Tenant;
  t: TFn;
  locale: Locale;
  availableLocales: Locale[];
}) {
  const vibe = VIBE_CONFIG[tenant.vibe];
  const menuLabel =
    vibe?.menuPageLabel[locale as 'it' | 'en' | 'de'] ?? t('nav.menu');

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          {tenant.name}
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/menu" className="hover:text-foreground/70">
            {menuLabel}
          </Link>
          {vibe?.takesReservations && (
            <Link href="/prenota" className="hover:text-foreground/70">
              {t('nav.prenota')}
            </Link>
          )}
          <Link href="/contatti" className="hover:text-foreground/70">
            {t('nav.contatti')}
          </Link>
          <LocaleSwitcher current={locale} available={availableLocales} />
        </div>
      </nav>
    </header>
  );
}
