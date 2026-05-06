import { DevBanner } from '@/components/DevBanner';
import { CopyEmailCta } from '@/components/marketing/CopyEmailCta';

const CONTACT_EMAIL = 'ciao@factory.app';
const WHATSAPP_E164 = '393331234567'; // placeholder até Edson ter número operacional

export default function MarketingHome() {
  return (
    <>
      <DevBanner />
      <main className="flex min-h-dvh flex-col bg-background">
        <section className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="mx-auto max-w-2xl space-y-8 text-center">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              Factory
            </h1>
            <p className="text-balance text-lg text-muted-foreground sm:text-xl">
              Il tuo locale online in dieci minuti. Trattorie, gelaterie, caffetterie,
              enoteche — un sito multilingue, GDPR-compliant, pronto al volo.
            </p>
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">Scrivici per una demo</p>
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
            Alcune descrizioni di questo sito sono state generate con assistenza di intelligenza artificiale.
          </p>
        </footer>
      </main>
    </>
  );
}
