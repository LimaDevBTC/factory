import { createAdminClient } from '@/lib/supabase/admin';
import type { Tenant } from '@/lib/supabase/types';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function DashboardSettings({ params }: { params: { tenantId: string } }) {
  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', params.tenantId)
    .maybeSingle();
  if (!tenant) return null;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Impostazioni
        </h1>
        <p className="text-sm text-muted-foreground">
          Modifiche immediate sul sito pubblico. Cambio di vibe e orari avanzati
          richiedono assistenza — scrivi a ciao@thefactory.life.
        </p>
      </header>

      <SettingsForm tenant={tenant as Tenant} />
    </div>
  );
}
