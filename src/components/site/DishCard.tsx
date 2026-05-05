import Image from 'next/image';
import type { Item, Locale } from '@/lib/supabase/types';
import { localized } from '@/lib/i18n';
import { formatPriceCents } from '@/lib/format';
import { AllergenBadges } from './AllergenBadges';
import { DietaryBadges } from './DietaryBadges';

export function DishCard({
  item,
  locale,
  enabledLocales,
}: {
  item: Item;
  locale: Locale;
  enabledLocales: Locale[];
}) {
  const name = localized(item, 'name', locale, enabledLocales) ?? item.name_it;
  const description = localized(item, 'description', locale, enabledLocales);
  const localeShort = (locale === 'it' || locale === 'en' || locale === 'de') ? locale : 'it';
  const intlLocale = ({ it: 'it-IT', en: 'en-GB', de: 'de-DE' } as const)[localeShort];
  const price = formatPriceCents(item.price_cents, item.currency || 'EUR', intlLocale);

  const meta: string[] = [];
  if (item.vintage_year) meta.push(String(item.vintage_year));
  if (item.origin) meta.push(item.origin);
  if (item.abv != null) meta.push(`${item.abv}%`);
  if (item.volume_ml) meta.push(`${item.volume_ml}ml`);

  return (
    <article className="flex gap-4 border-b border-border/60 py-4 last:border-b-0">
      {item.image_url && (
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          <Image src={item.image_url} alt={name} fill sizes="80px" className="object-cover" />
        </div>
      )}
      <div className="flex-1">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">{name}</h3>
            {meta.length > 0 && (
              <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                {meta.join(' · ')}
              </p>
            )}
          </div>
          <span className="whitespace-nowrap font-display text-base font-semibold tenant-primary">
            {price}
          </span>
        </header>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <DietaryBadges dietary={item.dietary} locale={localeShort} />
          <AllergenBadges allergens={item.allergens} locale={localeShort} />
        </div>
      </div>
    </article>
  );
}
