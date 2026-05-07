import Link from 'next/link';
import { ArrowRight, Eye } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PitchSession, Category, Item } from '@/lib/supabase/types';
import { ItemReviewList } from '@/components/pipeline/ItemReviewList';
import { advanceStageAction } from '@/app/app/(protected)/pipeline/[sessionId]/actions';
import { AdvanceFormButton } from '@/components/pipeline/AdvanceFormButton';

export async function ReadyStage({ session }: { session: PitchSession }) {
  if (!session.tenant_id) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Tenant ainda não foi criado nessa sessão. Volta pra coleta.
      </div>
    );
  }

  const supabase = createAdminClient();
  const [{ data: cats }, { data: items }, { data: tenant }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', session.tenant_id)
      .order('display_order', { ascending: true }),
    supabase
      .from('items')
      .select('*')
      .eq('tenant_id', session.tenant_id)
      .order('display_order', { ascending: true }),
    supabase
      .from('tenants')
      .select('slug')
      .eq('id', session.tenant_id)
      .maybeSingle(),
  ]);

  const categories = (cats ?? []) as Category[];
  const allItems = (items ?? []) as Item[];

  const action = advanceStageAction.bind(null, session.id, 'ready');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-4">
        <div>
          <p className="text-sm font-medium">{categories.length} categorias · {allItems.length} items</p>
          <p className="text-xs text-muted-foreground">
            Toca pra editar nome ou preço. Allergens e dietary ficam pro dashboard do dono.
          </p>
        </div>
        {tenant?.slug && (
          <Link
            href={`/pipeline/${session.id}/present`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs hover:bg-secondary"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Preview
          </Link>
        )}
      </div>

      <ItemReviewList sessionId={session.id} categories={categories} items={allItems} />

      <form action={action}>
        <AdvanceFormButton label="Vou apresentar agora">
          <ArrowRight className="h-4 w-4" aria-hidden />
        </AdvanceFormButton>
      </form>
    </div>
  );
}
