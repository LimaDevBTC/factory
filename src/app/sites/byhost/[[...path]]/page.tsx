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
            <h1 className="font-display text-4xl font-semibold">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground">
              Sito in costruzione. Tornaci tra qualche giorno.
            </p>
          </div>
        </main>
      );
    }
  }

  // Dev convenience: lista as URLs corretas em PT pra Edson saber pra onde ir.
  // Em produção quem cai aqui é visitante final num custom domain quebrado:
  // mostra a mensagem IT de "lugar não encontrado".
  if (process.env.NODE_ENV === 'development') {
    return <DevHelp host={host} />;
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

function DevHelp({ host }: { host: string | null }) {
  const port = '3000';
  const root = (process.env.KNOWN_ROOT_DOMAINS ?? 'lvh.me')
    .split(',')
    .map((d) => d.trim())
    .find((d) => d !== 'factory.app' && d !== 'localhost') ?? 'lvh.me';

  const links: { label: string; href: string; sub: string }[] = [
    { label: 'Marketing (IT)',           href: `http://${root}:${port}`,                          sub: 'landing público pra captar clientes' },
    { label: 'App operador (PT)',        href: `http://app.${root}:${port}`,                      sub: 'login + pipeline de pitches' },
    { label: 'Tenant — trattoria (IT)',  href: `http://da-luigi.${root}:${port}`,                 sub: 'site de cliente exemplo' },
    { label: 'Tenant — gelateria (IT)',  href: `http://gelateria-bergamotto.${root}:${port}`,     sub: 'site de cliente exemplo' },
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Factory · dev</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Host não reconhecido
        </h1>
        <p className="text-sm text-muted-foreground">
          Você acessou via <code className="rounded bg-muted px-1 py-0.5 text-xs">{host ?? 'localhost'}</code>,
          que não está em <code className="rounded bg-muted px-1 py-0.5 text-xs">KNOWN_ROOT_DOMAINS</code>.
          Use uma destas URLs:
        </p>
      </div>

      <ul className="mt-6 space-y-2">
        {links.map((l) => (
          <li key={l.href} className="rounded-lg border border-border bg-card p-4 hover:bg-secondary">
            <a href={l.href} className="block">
              <p className="font-medium">{l.label}</p>
              <p className="text-xs text-muted-foreground">{l.sub}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{l.href}</p>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-1 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Por que cada idioma?</p>
        <p>App operador em <strong>português</strong> — você usa pra vender em campo.</p>
        <p>Marketing e sites tenant em <strong>italiano</strong> — clientes finais (Cosenza/Itália) e visitantes dos restaurantes.</p>
      </div>
    </main>
  );
}
