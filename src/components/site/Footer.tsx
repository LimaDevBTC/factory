import Link from 'next/link';
import type { Tenant } from '@/lib/supabase/types';
import type { TFn } from '@/lib/i18n';
import { CookieBanner } from './CookieBanner';

export function Footer({ tenant, t }: { tenant: Tenant; t: TFn }) {
  const publicEmail = tenant.public_email ?? tenant.contact_email;

  return (
    <footer className="mt-16 border-t border-border/60 px-4 py-10 text-sm text-muted-foreground sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="font-medium text-foreground">{tenant.name}</p>
            {[tenant.address, tenant.city && [tenant.postal_code, tenant.city].filter(Boolean).join(' '), tenant.province]
              .filter(Boolean)
              .map((line, i) => <p key={i}>{line}</p>)}
            {publicEmail && <p>{publicEmail}</p>}
            {tenant.phone && <p>{tenant.phone}</p>}
          </div>
          <div className="space-y-1 sm:text-right">
            {tenant.partita_iva && <p>{t('footer.p_iva')}: {tenant.partita_iva}</p>}
            <p className="text-xs">{t('footer.ai_disclosure')}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:justify-end">
              <Link href="/legal/privacy" className="hover:text-foreground">{t('footer.privacy')}</Link>
              <Link href="/legal/terms" className="hover:text-foreground">{t('footer.terms')}</Link>
            </div>
          </div>
        </div>
      </div>
      <CookieBanner messages={{
        title: t('cookies.title'),
        body: t('cookies.body'),
        necessary: t('cookies.necessary'),
        analytics: t('cookies.analytics'),
        marketing: t('cookies.marketing'),
        accept_all: t('cookies.accept_all'),
        save: t('cookies.save'),
        reject_all: t('cookies.reject_all'),
        always_on: t('cookies.always_on'),
        prefs: t('footer.cookie_preferences'),
      }} />
    </footer>
  );
}
