import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getOrganizationByRootDomain, getTenantBySlug } from '@/lib/tenant';
import { VIBE_CONFIG } from '@/lib/verticals';

export const dynamic = 'force-dynamic';

export default async function TenantHome({ params }: { params: { slug: string } }) {
  const headerList = headers();
  const rootDomain = headerList.get('x-org-root-domain');

  if (!rootDomain) {
    notFound();
  }

  const org = await getOrganizationByRootDomain(rootDomain);
  if (!org) {
    notFound();
  }

  const tenant = await getTenantBySlug(org.id, params.slug);
  if (!tenant || tenant.status !== 'live') {
    return <NotFoundIT />;
  }

  const vibe = VIBE_CONFIG[tenant.vibe as keyof typeof VIBE_CONFIG];

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            {vibe?.label.it ?? tenant.vibe}
          </p>
          <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            {tenant.business_name}
          </h1>
          <p className="text-balance text-base text-muted-foreground">
            Sito in costruzione. Tornaci tra qualche giorno.
          </p>
        </div>
      </section>
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <p>{tenant.business_name}{tenant.p_iva ? ` · P.IVA ${tenant.p_iva}` : ''}</p>
        <p className="mt-1">
          Alcune descrizioni di questo sito sono state generate con assistenza di intelligenza artificiale.
        </p>
      </footer>
    </main>
  );
}

function NotFoundIT() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="font-display text-4xl font-semibold">Locale non trovato</h1>
        <p className="text-sm text-muted-foreground">
          L&rsquo;indirizzo che hai digitato non corrisponde a nessun locale attivo.
        </p>
      </div>
    </main>
  );
}
