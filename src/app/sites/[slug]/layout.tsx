import { cookies, headers } from 'next/headers';
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
import { pairingForTenant, renderTenantStyle } from '@/lib/branding';
import { pairingClassNames } from '@/lib/fonts';
import { isValidPreviewToken, PREVIEW_COOKIE_PREFIX } from '@/lib/preview';

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
  if (!tenant) notFound();

  if (tenant.status !== 'live') {
    // Permite preview de drafts/suspended quando há um preview token válido
    // (settado via middleware quando ?preview= aparece na URL).
    const token = cookies().get(PREVIEW_COOKIE_PREFIX + params.slug)?.value;
    const allowed = token ? await isValidPreviewToken(token, tenant.id) : false;
    if (!allowed) notFound();
  }

  const locale = resolveSiteLocale(tenant);
  const messages = getMessages(locale);
  const t = createT(messages);
  const availableLocales = localeFromTenant(tenant);
  const pairing = pairingForTenant(tenant);

  return (
    <div
      data-tenant={tenant.id}
      data-vibe={tenant.vibe}
      className={`min-h-dvh bg-background ${pairingClassNames(pairing)}`}
    >
      <style dangerouslySetInnerHTML={{ __html: renderTenantStyle(tenant) }} />
      <Header
        tenant={tenant}
        t={t}
        locale={locale}
        availableLocales={availableLocales}
      />
      {children}
      <Footer tenant={tenant} t={t} />
    </div>
  );
}
