import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrgMembership } from '@/lib/tenant';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
  }

  const session = await getCurrentUserOrgMembership();

  if (!session) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="font-display text-3xl font-semibold">Acesso negado</h1>
          <p className="text-sm text-muted-foreground">
            Esse email está autenticado mas não pertence a nenhuma organização. Contate o administrador.
          </p>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-secondary"
            >
              Sair
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-display text-lg font-semibold tracking-tight">Factory</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-muted-foreground">{session.user.email}</span>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-secondary"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
