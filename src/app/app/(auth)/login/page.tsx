import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

const DEV_BYPASS_EMAIL = (process.env.OPERATOR_EMAILS ?? '')
  .split(',').map((e) => e.trim()).filter(Boolean)[0];

export default function LoginPage() {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Factory</h1>
          <p className="text-sm text-muted-foreground">Acesso operador</p>
        </div>
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
