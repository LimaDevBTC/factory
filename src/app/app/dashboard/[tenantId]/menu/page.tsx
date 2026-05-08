import { createAdminClient } from '@/lib/supabase/admin';
import type { Category, Item } from '@/lib/supabase/types';
import { ItemReviewList } from '@/components/pipeline/ItemReviewList';

export const dynamic = 'force-dynamic';

export default async function DashboardMenu({ params }: { params: { tenantId: string } }) {
  const supabase = createAdminClient();
  const [{ data: cats }, { data: items }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .order('display_order', { ascending: true }),
    supabase
      .from('items')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .order('display_order', { ascending: true }),
  ]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Menu</h1>
        <p className="text-sm text-muted-foreground">
          Tocca la matita per modificare nome, prezzo o descrizione. Modifiche
          immediate sul sito pubblico.
        </p>
      </header>

      <ItemReviewList
        sessionId={params.tenantId}
        categories={(cats ?? []) as Category[]}
        items={(items ?? []) as Item[]}
      />
    </div>
  );
}
