export default function PipelineHome() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seus pitches em tempo real.</p>
      </header>

      <section className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum pitch em curso. Toque em + para começar.
        </p>
      </section>

      <button
        type="button"
        disabled
        title="Em construção — T4"
        aria-label="Novo pitch"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl text-primary-foreground shadow-lg disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}
