import { DevBanner } from '@/components/DevBanner';

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
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="mailto:ciao@factory.app?subject=Demo%20Factory"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Richiedi una demo
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
