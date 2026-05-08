import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Utensils,
  CalendarDays,
  Settings,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Tenant } from '@/lib/supabase/types';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantId: string };
}) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(`/login?error=login_required`);
  }
  const userId = userData.user.id;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from('tenants')
    .select('*')
    .eq('id', params.tenantId)
    .maybeSingle();
  if (!tenant) {
    redirect('/pipeline?error=tenant_not_found');
  }
  const t = tenant as Tenant;

  // Acesso: usuário está em tenant_users como owner/staff OU é operator/admin
  // da organização dona do tenant.
  const [{ data: tenantUser }, { data: orgMember }] = await Promise.all([
    admin
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', t.id)
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('org_members')
      .select('role')
      .eq('organization_id', t.organization_id)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  if (!tenantUser && !orgMember) {
    redirect('/pipeline?error=forbidden_dashboard');
  }
  const accessAs: 'owner' | 'operator' = tenantUser ? 'owner' : 'operator';

  const headerList = headers();
  const rawHost = headerList.get('host') ?? '';
  const port = rawHost.match(/:(\d+)$/)?.[1];
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  const rootDomain = headerList.get('x-org-root-domain') ?? 'factory.app';
  const portSuffix = port ? `:${port}` : '';
  const siteUrl = `${proto}://${t.slug}.${rootDomain}${portSuffix}`;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/${t.id}`}
              className="font-display text-lg font-semibold tracking-tight"
            >
              {t.name}
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              · {accessAs === 'owner' ? 'Pannello del titolare' : 'Operator preview'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary sm:inline-flex"
            >
              Vedi il sito
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
            <form action="/logout" method="post">
              <button
                type="submit"
                aria-label="Esci"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-secondary sm:hidden"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="submit"
                className="hidden rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary sm:inline-block"
              >
                Esci
              </button>
            </form>
          </div>
        </div>

        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm sm:px-6">
          <NavLink href={`/dashboard/${t.id}`} icon={<LayoutDashboard className="h-3.5 w-3.5" />}>
            Panoramica
          </NavLink>
          <NavLink href={`/dashboard/${t.id}/menu`} icon={<Utensils className="h-3.5 w-3.5" />}>
            Menu
          </NavLink>
          <NavLink href={`/dashboard/${t.id}/bookings`} icon={<CalendarDays className="h-3.5 w-3.5" />}>
            Prenotazioni
          </NavLink>
          <NavLink href={`/dashboard/${t.id}/settings`} icon={<Settings className="h-3.5 w-3.5" />}>
            Impostazioni
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
