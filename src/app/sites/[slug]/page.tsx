import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getOrganizationByRootDomain, getTenantBySlug } from '@/lib/tenant';
import { resolveSiteLocale, getMessages, createT } from '@/lib/i18n';
import { Hero } from '@/components/site/Hero';
import { Highlights } from '@/components/site/Highlights';

export default async function TenantHome({ params }: { params: { slug: string } }) {
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
  const localeShort = (locale === 'it' || locale === 'en' || locale === 'de') ? locale : 'it';

  return (
    <>
      <Hero tenant={tenant} locale={locale} />
      <Highlights tenant={tenant} t={t} locale={localeShort} />
    </>
  );
}
