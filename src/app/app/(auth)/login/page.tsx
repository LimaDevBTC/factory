import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Factory</h1>
          <p className="text-sm text-muted-foreground">Acesso operador</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
