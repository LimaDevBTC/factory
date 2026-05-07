import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { DevBanner } from '@/components/DevBanner';
import { CopyEmailCta } from '@/components/marketing/CopyEmailCta';

const CONTACT_EMAIL = 'ciao@factory.app';
const WHATSAPP_E164 = '393331234567'; // placeholder até número operacional

/**
 * Quando o magic link do Supabase volta pra Site URL (raiz do projeto) em vez
 * do `emailRedirectTo`, o `?code=` aterra aqui no marketing. Forwardamos pro
 * /callback no domínio do app onde o PKCE code_verifier (cookie sb-*) está
 * guardado — caso contrário exchangeCodeForSession falha com
 * "PKCE code verifier not found in storage".
 */
function maybeForwardAuthCode(searchParams: Record<string, string | string[] | undefined>) {
  const code = typeof searchParams.code === 'string' ? searchParams.code : null;
  if (!code) return;

  const h = headers();
  const rawHost = h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const port = rawHost.match(/:(\d+)$/)?.[1];

  let target: string;
  if (process.env.NODE_ENV === 'development') {
    // Em dev o cookie do PKCE foi setado em app.lvh.me (onde signInWithOtp
    // rodou). app.localhost é outro domain — cookies não viajam. Hardcode
    // lvh.me como o canônico dev.
    target = `${proto}://app.lvh.me${port ? `:${port}` : ''}/callback`;
  } else {
    const rootDomain = h.get('x-org-root-domain') ?? rawHost.replace(/:\d+$/, '');
    target = `${proto}://app.${rootDomain}/callback`;
  }
  redirect(`${target}?code=${encodeURIComponent(code)}`);
}

export default function MarketingHome({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  maybeForwardAuthCode(searchParams);

  return (
    <>
      <DevBanner />
      <main className="flex min-h-dvh flex-col bg-background">
        <section className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="mx-auto max-w-3xl space-y-10 text-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Factory
              </p>
              <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                Sites pra hospitalidade italiana, em 10 minutos.
              </h1>
              <p className="text-balance text-lg text-muted-foreground sm:text-xl">
                Plataforma de venda em campo. Você fotografa o cardápio, o
                Factory monta o site, o cliente paga em dinheiro, vai live na hora.
                Multilíngue, GDPR-compliant, mobile-first.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <Link
                href={process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/login` : 'http://app.lvh.me:3001/login'}
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Entrar como operador
              </Link>
              <p className="text-xs text-muted-foreground">
                Pipeline de pitches, dashboards, jobs Claude vision.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/40 px-6 py-10">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Sei un ristoratore?
            </p>
            <p className="text-balance text-base">
              Factory costruisce il tuo sito web in dieci minuti, davanti a te.
              Trattorie, gelaterie, caffetterie, enoteche. Scrivici per una demo —
              passiamo dal vivo.
            </p>
            <div className="flex flex-col items-center gap-3 pt-2">
              <CopyEmailCta email={CONTACT_EMAIL} />
              <a
                href={`https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent('Ciao! Vorrei una demo di Factory.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline-offset-4 hover:underline"
              >
                oppure su WhatsApp
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
          <p>Factory · P.IVA in attivazione</p>
          <p className="mt-1">
            Algumas descrições no site são geradas com assistência de IA.
            Alcune descrizioni di questo sito sono state generate con assistenza di intelligenza artificiale.
          </p>
        </footer>
      </main>
    </>
  );
}
