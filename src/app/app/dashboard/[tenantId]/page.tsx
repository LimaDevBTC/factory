import { headers } from 'next/headers';
import Link from 'next/link';
import { ExternalLink, AlertCircle, FileText, Mail } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Tenant, Booking } from '@/lib/supabase/types';
import { formatPriceCents } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DashboardOverview({ params }: { params: { tenantId: string } }) {
  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', params.tenantId)
    .maybeSingle();
  if (!tenant) return null;
  const t = tenant as Tenant;

  const [{ count: itemsCount }, { count: bookingsTotal }, { count: bookingsPending }] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id).eq('status', 'pending'),
  ]);

  const { data: latestBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('tenant_id', t.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const headerList = headers();
  const rawHost = headerList.get('host') ?? '';
  const port = rawHost.match(/:(\d+)$/)?.[1];
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  const rootDomain = headerList.get('x-org-root-domain') ?? 'thefactory.life';
  const portSuffix = port ? `:${port}` : '';
  const siteUrl = `${proto}://${t.slug}.${rootDomain}${portSuffix}`;

  // Withdrawal countdown
  const withdrawalEnd = t.withdrawal_window_ends_at ? new Date(t.withdrawal_window_ends_at) : null;
  const withinWindow = withdrawalEnd && withdrawalEnd > new Date();
  const withdrawalDaysLeft = withdrawalEnd
    ? Math.max(0, Math.ceil((withdrawalEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  // Service period
  const serviceEnd = t.service_period_ends_at ? new Date(t.service_period_ends_at) : null;
  const serviceDaysLeft = serviceEnd
    ? Math.max(0, Math.ceil((serviceEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return (
    <div className="space-y-6">
      {withinWindow && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" aria-hidden />
            <div>
              <p className="font-medium text-amber-900">
                Diritto di recesso ancora attivo · {withdrawalDaysLeft} giorni rimanenti
              </p>
              <p className="mt-0.5 text-sm text-amber-900">
                Anche dopo aver acconsentito alla rinuncia, puoi richiedere rimborso integrale fino a{' '}
                <strong>{withdrawalEnd!.toLocaleDateString('it-IT')}</strong>.
                Scrivi a <a href="mailto:ciao@thefactory.life" className="underline">ciao@thefactory.life</a>.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Sito pubblico</p>
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 font-mono text-base font-medium hover:underline"
        >
          {siteUrl}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        <p className="mt-1 text-xs text-muted-foreground">
          Stato:{' '}
          <span
            className={
              t.status === 'live'
                ? 'font-medium text-emerald-700'
                : 'font-medium text-muted-foreground'
            }
          >
            {t.status}
          </span>
          {' '}· vibe: {t.vibe}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Voci nel menu" value={itemsCount ?? 0} href={`/dashboard/${t.id}/menu`} />
        <Stat
          label="Prenotazioni totali"
          value={bookingsTotal ?? 0}
          href={`/dashboard/${t.id}/bookings`}
        />
        <Stat
          label="In attesa"
          value={bookingsPending ?? 0}
          href={`/dashboard/${t.id}/bookings`}
          tone={(bookingsPending ?? 0) > 0 ? 'warning' : 'neutral'}
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Pacchetto</p>
        <p className="mt-1 font-display text-xl font-semibold">
          {t.plan ?? '—'} · {t.billing_period ?? '—'}
        </p>
        {t.cash_collected_amount && (
          <p className="text-sm text-muted-foreground">
            Pagato: {formatPriceCents(t.cash_collected_amount)} (contanti)
          </p>
        )}
        {serviceEnd && (
          <p className="mt-2 text-sm">
            Valido fino a <strong>{serviceEnd.toLocaleDateString('it-IT')}</strong>
            {serviceDaysLeft > 0 && (
              <span className="text-muted-foreground"> · {serviceDaysLeft} giorni rimanenti</span>
            )}
          </p>
        )}
        {t.cash_receipt_pdf_url && (
          <a
            href={t.cash_receipt_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Scarica ricevuta PDF
          </a>
        )}
      </section>

      {latestBookings && latestBookings.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Ultime prenotazioni
            </p>
            <Link
              href={`/dashboard/${t.id}/bookings`}
              className="text-xs text-primary hover:underline"
            >
              Vedi tutte
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {(latestBookings as Booking[]).map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{b.customer_name} · {b.party_size}p</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.requested_at).toLocaleString('it-IT', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <BookingStatus status={b.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          <div>
            <p>Hai bisogno di aiuto?</p>
            <p className="mt-0.5 text-xs">
              Scrivi a <a href="mailto:ciao@thefactory.life" className="text-primary hover:underline">ciao@thefactory.life</a>
              {' '}— rispondiamo entro 48h.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone?: 'warning' | 'neutral';
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-4 transition hover:bg-secondary"
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-3xl font-semibold ${
          tone === 'warning' ? 'text-amber-700' : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

function BookingStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'In attesa', className: 'bg-amber-100 text-amber-800' },
    confirmed: { label: 'Confermata', className: 'bg-emerald-100 text-emerald-800' },
    declined: { label: 'Rifiutata', className: 'bg-secondary text-muted-foreground' },
    cancelled: { label: 'Annullata', className: 'bg-secondary text-muted-foreground' },
    no_show: { label: 'No-show', className: 'bg-secondary text-muted-foreground' },
    completed: { label: 'Completata', className: 'bg-emerald-100 text-emerald-800' },
  };
  const v = map[status] ?? { label: status, className: 'bg-secondary' };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${v.className}`}>
      {v.label}
    </span>
  );
}
