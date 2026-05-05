import Link from 'next/link';
import Image from 'next/image';
import type { Tenant, Locale } from '@/lib/supabase/types';
import { VIBE_CONFIG } from '@/lib/verticals';
import { localized } from '@/lib/i18n';

export function Hero({
  tenant,
  locale,
}: {
  tenant: Tenant;
  locale: Locale;
}) {
  const vibe = VIBE_CONFIG[tenant.vibe];
  const cta = vibe?.menuCta[locale as 'it' | 'en' | 'de'] ?? 'Menu';
  const tagline = localized(tenant, 'tagline', locale, tenant.enabled_locales);
  const description = localized(tenant, 'description', locale, tenant.enabled_locales);
  const lang = (vibe?.label[locale as 'it' | 'en' | 'de'] ?? tenant.vibe).toString();

  return (
    <section className="relative overflow-hidden">
      {tenant.hero_image_url ? (
        <div className="relative h-[60vh] min-h-[420px] w-full">
          <Image
            src={tenant.hero_image_url}
            alt={tenant.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
          <HeroContent
            tenant={tenant}
            tagline={tagline}
            description={description}
            cta={cta}
            categoryLabel={lang}
            invert
          />
        </div>
      ) : (
        <div className="tenant-bg-secondary px-4 py-20 sm:py-28">
          <HeroContent
            tenant={tenant}
            tagline={tagline}
            description={description}
            cta={cta}
            categoryLabel={lang}
          />
        </div>
      )}
    </section>
  );
}

function HeroContent({
  tenant,
  tagline,
  description,
  cta,
  categoryLabel,
  invert,
}: {
  tenant: Tenant;
  tagline: string | null;
  description: string | null;
  cta: string;
  categoryLabel: string;
  invert?: boolean;
}) {
  return (
    <div
      className={
        'relative z-10 mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-4 text-center ' +
        (invert ? 'text-white' : 'text-foreground')
      }
    >
      <p
        className={
          'text-xs uppercase tracking-[0.25em] ' +
          (invert ? 'text-white/80' : 'text-muted-foreground')
        }
      >
        {categoryLabel}
      </p>
      <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
        {tenant.name}
      </h1>
      {tagline && (
        <p
          className={
            'max-w-xl text-balance text-lg sm:text-xl ' +
            (invert ? 'text-white/95' : 'text-foreground/85')
          }
        >
          {tagline}
        </p>
      )}
      {description && (
        <p
          className={
            'max-w-xl text-balance text-sm sm:text-base ' +
            (invert ? 'text-white/85' : 'text-muted-foreground')
          }
        >
          {description}
        </p>
      )}
      <div className="mt-3">
        <Link
          href="/menu"
          className="inline-flex h-12 items-center justify-center rounded-full px-8 text-base font-medium tenant-bg-primary shadow-md transition hover:opacity-95"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}
