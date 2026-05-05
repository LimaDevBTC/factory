import { headers } from 'next/headers';
import { getTenantByCustomDomain } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function CustomDomainPlaceholder() {
  const headerList = headers();
  const host = headerList.get('x-custom-domain');

  if (host) {
    const tenant = await getTenantByCustomDomain(host);
    if (tenant && tenant.status === 'live') {
      return (
        <main className="flex min-h-dvh items-center justify-center bg-background px-6">
          <div className="max-w-md space-y-3 text-center">
            <h1 className="font-display text-4xl font-semibold">
              {tenant.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Sito in costruzione. Tornaci tra qualche giorno.
            </p>
          </div>
        </main>
      );
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="font-display text-4xl font-semibold">Locale non trovato</h1>
        <p className="text-sm text-muted-foreground">
          Questo dominio non è collegato a nessun locale attivo.
        </p>
      </div>
    </main>
  );
}
