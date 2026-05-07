import Link from 'next/link';
import { ArrowRight, Maximize2 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PitchSession } from '@/lib/supabase/types';
import { advanceStageAction } from '@/app/app/(protected)/pipeline/[sessionId]/actions';
import { AdvanceFormButton } from '@/components/pipeline/AdvanceFormButton';
import { headers } from 'next/headers';

export async function PresentStage({ session }: { session: PitchSession }) {
  if (!session.tenant_id) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Tenant ainda não foi criado. Volta pra coleta.
      </div>
    );
  }

  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', session.tenant_id)
    .maybeSingle();
  if (!tenant?.slug) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Tenant não encontrado.
      </div>
    );
  }

  // Constrói URL do site tenant — em dev, usa lvh.me com porta atual
  const h = headers();
  const rawHost = h.get('host') ?? '';
  const port = rawHost.match(/:(\d+)$/)?.[1] ?? '3001';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const rootDomain = h.get('x-org-root-domain') ?? 'lvh.me';
  const siteUrl = `${proto}://${tenant.slug}.${rootDomain}:${port}/?preview=${session.id}`;

  const action = advanceStageAction.bind(null, session.id, 'present');

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4 text-sm">
        <p className="font-medium">Modo apresentação</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Entrega o celular nele em modo paisagem. Brilho máximo. Deixa ele
          tocar, rolar, mexer. Não explica — deixa o produto falar.
        </p>
      </div>

      <a
        href={siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md tenant-bg-primary text-base font-medium shadow-sm transition hover:opacity-95"
      >
        <Maximize2 className="h-4 w-4" aria-hidden />
        Abrir site em tela cheia (nova aba)
      </a>

      <div className="overflow-hidden rounded-xl border border-border">
        <iframe
          src={siteUrl}
          title="Preview do site"
          className="h-[70vh] w-full"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>

      <form action={action}>
        <AdvanceFormButton label="Ele viu, vou pro preço">
          <ArrowRight className="h-4 w-4" aria-hidden />
        </AdvanceFormButton>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        URL preview: <code className="text-[10px]">{siteUrl}</code>
      </p>
    </div>
  );
}
