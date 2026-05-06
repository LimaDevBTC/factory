import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

const DEV_BYPASS_EMAIL = (process.env.OPERATOR_EMAILS ?? '')
  .split(',').map((e) => e.trim()).filter(Boolean)[0];

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const isDev = process.env.NODE_ENV === 'development';
  const errorRaw = typeof searchParams.error === 'string' ? searchParams.error : null;
  const errorMessage = errorRaw ? friendlyError(errorRaw) : null;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Factory</h1>
          <p className="text-sm text-muted-foreground">Acesso operador</p>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <LoginForm />

        {isDev && DEV_BYPASS_EMAIL && (
          <div className="space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
            <p className="font-medium">Atalho dev (SMTP do Supabase às vezes fica em spam)</p>
            <p>
              <a
                href={`/api/dev/login?email=${encodeURIComponent(DEV_BYPASS_EMAIL)}`}
                className="underline underline-offset-2 hover:no-underline"
              >
                Entrar como {DEV_BYPASS_EMAIL} sem email
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('pkce')) {
    return 'Sessão de login expirou ou foi iniciada em outro navegador. Toque "Enviar link mágico" de novo aqui no mesmo navegador, depois clica no link do email.';
  }
  if (lower.includes('missing_code')) {
    return 'Faltou o código de verificação. Tenta de novo.';
  }
  if (lower.includes('expired')) {
    return 'Esse link expirou (válido por 1h). Pede um novo.';
  }
  return raw;
}
