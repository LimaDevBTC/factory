import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getOrganizationByRootDomain, getTenantBySlug } from '@/lib/tenant';
import { resolveSiteLocale, getMessages, createT } from '@/lib/i18n';
import { VIBE_CONFIG } from '@/lib/verticals';
import { BookingForm } from '@/components/site/BookingForm';

export const dynamic = 'force-dynamic';

export default async function PrenotaPage({ params }: { params: { slug: string } }) {
  const headerList = headers();
  const rootDomain = headerList.get('x-org-root-domain');
  if (!rootDomain) notFound();

  const org = await getOrganizationByRootDomain(rootDomain);
  if (!org) notFound();

  const tenant = await getTenantBySlug(org.id, params.slug);
  if (!tenant) notFound();

  const vibe = VIBE_CONFIG[tenant.vibe];
  if (!vibe?.takesReservations) notFound();

  const locale = resolveSiteLocale(tenant);
  const messages = getMessages(locale);
  const t = createT(messages);

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t('booking.title')}</h1>
      </header>
      <div className="mt-8">
        <BookingForm
          locale={locale}
          messages={{
            name: t('booking.name'),
            phone: t('booking.phone'),
            email: t('booking.email'),
            party_size: t('booking.party_size'),
            requested_at: t('booking.requested_at'),
            notes: t('booking.notes'),
            consent: t('booking.consent'),
            marketing: t('booking.marketing'),
            submit: t('booking.submit'),
            submitting: t('booking.submitting'),
            success_title: t('booking.success_title'),
            success_body: t('booking.success_body'),
            error_generic: t('booking.error_generic'),
          }}
        />
      </div>
    </main>
  );
}
