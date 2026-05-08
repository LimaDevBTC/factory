import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold">
            Factory
          </Link>
          <nav className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground">Termini</Link>
            <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/legal/dpa" className="hover:text-foreground">DPA</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="prose prose-sm max-w-none prose-headings:font-display prose-headings:tracking-tight prose-p:leading-relaxed">
          {children}
        </article>
      </main>
    </div>
  );
}
