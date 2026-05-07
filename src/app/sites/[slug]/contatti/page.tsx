import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getOrganizationByRootDomain, getTenantBySlug } from '@/lib/tenant';
import { resolveSiteLocale, getMessages, createT } from '@/lib/i18n';
import { orderedHours, formatSlot } from '@/lib/hours';
import { MapEmbed } from '@/components/site/MapEmbed';

export const dynamic = 'force-dynamic';

export default async function ContattiPage({ params }: { params: { slug: string } }) {
  const headerList = headers();
  const rootDomain = headerList.get('x-org-root-domain');
  if (!rootDomain) notFound();

  const org = await getOrganizationByRootDomain(rootDomain);
  if (!org) notFound();

  const tenant = await getTenantBySlug(org.id, params.slug);
  if (!tenant) notFound();

  const locale = resolveSiteLocale(tenant);
  const messages = getMessages(locale);
  const t = createT(messages);

  const fullAddress = [
    tenant.address,
    [tenant.postal_code, tenant.city].filter(Boolean).join(' '),
    tenant.province,
    tenant.region,
  ]
    .filter(Boolean)
    .join(', ');
  const mapsQuery = fullAddress || tenant.name;
  const publicEmail = tenant.public_email ?? tenant.contact_email;

  const days = orderedHours(tenant.hours_json);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t('contatti.title')}</h1>
      </header>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section className="space-y-5">
          {fullAddress && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('contatti.address')}</p>
              <p className="mt-1 text-base">{fullAddress}</p>
            </div>
          )}
          {(tenant.phone || tenant.whatsapp) && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('contatti.phone')}</p>
              {tenant.phone && (
                <p className="mt-1">
                  <a href={`tel:${tenant.phone}`} className="hover:underline">{tenant.phone}</a>
                </p>
              )}
              {tenant.whatsapp && (
                <p className="text-sm text-muted-foreground">
                  {t('contatti.whatsapp')}:{' '}
                  <a
                    href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {tenant.whatsapp}
                  </a>
                </p>
              )}
            </div>
          )}
          {publicEmail && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('contatti.email')}</p>
              <p className="mt-1">
                <a href={`mailto:${publicEmail}`} className="hover:underline">{publicEmail}</a>
              </p>
            </div>
          )}
        </section>

        <section>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('contatti.hours')}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {days.map(({ day, slots }) => (
              <li key={day} className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{t(`days.${day}` as 'days.mon')}</span>
                <span className="text-muted-foreground">
                  {slots.length === 0 ? t('contatti.closed') : slots.map(formatSlot).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10">
        <MapEmbed query={mapsQuery} consentMessage={t('contatti.map_consent')} />
      </section>
    </main>
  );
}
