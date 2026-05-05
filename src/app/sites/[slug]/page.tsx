import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getOrganizationByRootDomain, getTenantBySlug } from '@/lib/tenant';
import { VIBE_CONFIG } from '@/lib/verticals';
import { resolveSiteLocale } from '@/lib/i18n';

export default async function TenantHome({ params }: { params: { slug: string } }) {
  const headerList = headers();
  const rootDomain = headerList.get('x-org-root-domain');
  if (!rootDomain) notFound();

  const org = await getOrganizationByRootDomain(rootDomain);
  if (!org) notFound();

  const tenant = await getTenantBySlug(org.id, params.slug);
  if (!tenant || tenant.status !== 'live') notFound();

  const vibe = VIBE_CONFIG[tenant.vibe];
  const locale = resolveSiteLocale(tenant);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        {vibe?.label[locale as 'it' | 'en' | 'de'] ?? tenant.vibe}
      </p>
      <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
        {tenant.name}
      </h1>
      <p className="mt-6 text-balance text-base text-muted-foreground">
        Sito in costruzione. Tornaci tra qualche giorno.
      </p>
    </main>
  );
}
