import Link from 'next/link';
import { Clock, MapPin, Phone } from 'lucide-react';
import type { Tenant } from '@/lib/supabase/types';
import type { TFn } from '@/lib/i18n';
import { VIBE_CONFIG } from '@/lib/verticals';
import { hoursOpenToday, formatTodayHours } from '@/lib/hours';

export function Highlights({
  tenant,
  t,
  locale,
}: {
  tenant: Tenant;
  t: TFn;
  locale: 'it' | 'en' | 'de';
}) {
  const vibe = VIBE_CONFIG[tenant.vibe];
  const today = hoursOpenToday(tenant.hours_json);
  const todayLabel = formatTodayHours(today, locale);
  const addressLine = [tenant.address, tenant.city].filter(Boolean).join(', ');

  return (
    <section className="mx-auto grid max-w-5xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6">
      <Card icon={<Clock className="h-5 w-5" aria-hidden />} title={t('contatti.hours')}>
        <p className="text-sm">{todayLabel}</p>
        <Link href="/contatti" className="mt-1 inline-block text-xs underline-offset-2 hover:underline">
          {t('actions.see_hours')}
        </Link>
      </Card>
      {addressLine && (
        <Card icon={<MapPin className="h-5 w-5" aria-hidden />} title={t('contatti.address')}>
          <p className="text-sm">{addressLine}</p>
          <Link href="/contatti" className="mt-1 inline-block text-xs underline-offset-2 hover:underline">
            {t('actions.directions')}
          </Link>
        </Card>
      )}
      {(tenant.phone || tenant.whatsapp) && (
        <Card icon={<Phone className="h-5 w-5" aria-hidden />} title={t('contatti.phone')}>
          {tenant.phone && <p className="text-sm">{tenant.phone}</p>}
          {tenant.whatsapp && (
            <p className="text-sm text-muted-foreground">{t('contatti.whatsapp')}: {tenant.whatsapp}</p>
          )}
          {vibe?.takesReservations && (
            <Link href="/prenota" className="mt-1 inline-block text-xs underline-offset-2 hover:underline">
              {t('actions.book_table')}
            </Link>
          )}
        </Card>
      )}
    </section>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}
