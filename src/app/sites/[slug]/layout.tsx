import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import {
  resolveSiteLocale,
  getMessages,
  createT,
  localeFromTenant,
} from '@/lib/i18n';
import { getOrganizationByRootDomain, getTenantBySlug } from '@/lib/tenant';
import { VIBE_CONFIG } from '@/lib/verticals';
import { renderTenantStyle } from '@/lib/branding';

export const dynamic = 'force-dynamic';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
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
  const availableLocales = localeFromTenant(tenant);
  const vibe = VIBE_CONFIG[tenant.vibe];
  const fontPairing = (tenant.font_pairing as keyof typeof FONT_CLASSNAMES) ?? 'cinzel_inter';
  const fontClass = FONT_CLASSNAMES[fontPairing] ?? FONT_CLASSNAMES.cinzel_inter;

  return (
    <div className={`min-h-dvh bg-background ${fontClass}`}>
      <style dangerouslySetInnerHTML={{ __html: renderTenantStyle(tenant) }} />
      <Header
        tenant={tenant}
        t={t}
        locale={locale}
        availableLocales={availableLocales}
      />
      <div data-vibe={tenant.vibe} data-vibe-icon={vibe?.icon}>
        {children}
      </div>
      <Footer tenant={tenant} t={t} />
    </div>
  );
}

const FONT_CLASSNAMES: Record<string, string> = {
  cinzel_inter: 'font-sans',
  playfair_lato: 'font-sans',
  unbounded_inter: 'font-sans',
  cormorant_dmsans: 'font-sans',
};
