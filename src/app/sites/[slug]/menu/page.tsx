import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getOrganizationByRootDomain, getTenantBySlug } from '@/lib/tenant';
import { resolveSiteLocale, getMessages, createT, localized } from '@/lib/i18n';
import { loadMenu, parseFiltersFromSearchParams, applyFilters } from '@/lib/menu';
import { VIBE_CONFIG } from '@/lib/verticals';
import { MenuSection } from '@/components/site/MenuSection';
import { MenuFilters } from '@/components/site/MenuFilters';

export const dynamic = 'force-dynamic';

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const headerList = headers();
  const rootDomain = headerList.get('x-org-root-domain');
  if (!rootDomain) notFound();

  const org = await getOrganizationByRootDomain(rootDomain);
  if (!org) notFound();

  const tenant = await getTenantBySlug(org.id, params.slug);
  if (!tenant || tenant.status !== 'live') notFound();

  const locale = resolveSiteLocale(tenant);
  const messages = getMessages(locale);
  const t = createT(messages);
  const vibe = VIBE_CONFIG[tenant.vibe];
  const localeShort = (locale === 'it' || locale === 'en' || locale === 'de') ? locale : 'it';
  const pageLabel = vibe?.menuPageLabel[localeShort] ?? t('nav.menu');

  const { categories, itemsByCategoryId, itemsUncategorized } = await loadMenu(tenant.id);
  const filters = parseFiltersFromSearchParams(searchParams);

  const visibleCategories = categories
    .map((cat) => ({
      cat,
      items: applyFilters(itemsByCategoryId[cat.id] ?? [], filters),
    }))
    .filter(({ items }) => items.length > 0);

  const uncategorized = applyFilters(itemsUncategorized, filters);

  const totalItems =
    visibleCategories.reduce((acc, { items }) => acc + items.length, 0) + uncategorized.length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{pageLabel}</h1>
      </header>

      <MenuFilters t={t} />

      {totalItems === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t('menu.no_items')}
        </p>
      ) : (
        <div className="space-y-10">
          {visibleCategories.length > 1 && (
            <nav aria-label="Categorie" className="-mx-4 overflow-x-auto px-4">
              <ul className="flex gap-3 whitespace-nowrap text-sm">
                {visibleCategories.map(({ cat }) => {
                  const name = localized(cat, 'name', locale, tenant.enabled_locales) ?? cat.name_it;
                  return (
                    <li key={cat.id}>
                      <a
                        href={`#cat-${cat.slug ?? cat.id}`}
                        className="rounded-full border border-border bg-card px-3 py-1 hover:bg-secondary"
                      >
                        {name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {visibleCategories.map(({ cat, items }) => (
            <MenuSection
              key={cat.id}
              category={cat}
              items={items}
              locale={locale}
              enabledLocales={tenant.enabled_locales}
            />
          ))}

          {uncategorized.length > 0 && (
            <MenuSection
              category={{
                id: 'uncategorized',
                tenant_id: tenant.id,
                slug: 'altri',
                name_it: 'Altri',
                name_en: 'Others',
                name_de: 'Weitere',
                description_it: null,
                display_order: 999,
                created_at: new Date().toISOString(),
              }}
              items={uncategorized}
              locale={locale}
              enabledLocales={tenant.enabled_locales}
            />
          )}
        </div>
      )}
    </main>
  );
}
