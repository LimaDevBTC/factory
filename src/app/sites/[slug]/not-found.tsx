export default function TenantNotFound() {
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
