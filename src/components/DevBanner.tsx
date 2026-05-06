import { headers } from 'next/headers';

/**
 * Dev-only floating banner with shortcuts to the operator app + tenant demos.
 * Only renders when NODE_ENV === 'development'. Server component — emits no JS.
 */
export function DevBanner() {
  if (process.env.NODE_ENV !== 'development') return null;

  const rawHost = headers().get('host') ?? '';
  const host = rawHost.replace(/:\d+$/, '');
  const port = rawHost.match(/:(\d+)$/)?.[1] ?? '3000';

  // Sempre usar lvh.me pra atalhos: subdomínios de `localhost` não
  // resolvem em todos os browsers (Firefox precisa /etc/hosts).
  const root = 'lvh.me';

  const links = [
    { label: 'app operador',   href: `http://app.${root}:${port}`,                          sub: 'PT · pipeline de pitches' },
    { label: 'demo trattoria', href: `http://da-luigi.${root}:${port}`,                     sub: 'IT · site cliente' },
    { label: 'demo gelateria', href: `http://gelateria-bergamotto.${root}:${port}`,         sub: 'IT · site cliente' },
  ];

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          <strong>dev</strong> · este host (<code className="rounded bg-white/60 px-1">{rawHost}</code>) renderiza o
          marketing IT. Atalhos:
        </span>
        <ul className="flex flex-wrap gap-2">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                title={l.sub}
                className="rounded border border-amber-300 bg-white/70 px-2 py-0.5 underline-offset-2 hover:underline"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
