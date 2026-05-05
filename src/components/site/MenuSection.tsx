import type { Category, Item, Locale } from '@/lib/supabase/types';
import { localized } from '@/lib/i18n';
import { DishCard } from './DishCard';

export function MenuSection({
  category,
  items,
  locale,
  enabledLocales,
}: {
  category: Category;
  items: Item[];
  locale: Locale;
  enabledLocales: Locale[];
}) {
  const name = localized(category, 'name', locale, enabledLocales) ?? category.name_it;
  if (items.length === 0) return null;

  return (
    <section id={`cat-${category.slug ?? category.id}`} className="scroll-mt-20">
      <h2 className="font-display text-2xl font-semibold tracking-tight tenant-primary">
        {name}
      </h2>
      {category.description_it && locale === 'it' && (
        <p className="mt-1 text-sm text-muted-foreground">{category.description_it}</p>
      )}
      <div className="mt-3">
        {items.map((item) => (
          <DishCard
            key={item.id}
            item={item}
            locale={locale}
            enabledLocales={enabledLocales}
          />
        ))}
      </div>
    </section>
  );
}
