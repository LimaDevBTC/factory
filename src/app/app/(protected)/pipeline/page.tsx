import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getCurrentUserOrgMembership } from '@/lib/tenant';
import { loadPipelineForOperator } from '@/lib/pipeline';
import { PIPELINE_PLAYBOOK, type Stage } from '@/lib/scripts';

export const dynamic = 'force-dynamic';

const STAGE_LABEL: Record<Stage, string> = {
  approach: 'Abordagem',
  consent: 'Consentimento',
  capture: 'Coleta',
  processing: 'Processando',
  ready: 'Pronto',
  present: 'Apresentando',
  pricing: 'Preço',
  close: 'Fechamento',
};

export default async function PipelinePage() {
  const session = await getCurrentUserOrgMembership();
  if (!session) return null; // protected layout already handles redirect

  const { inFlight, recent, kpis } = await loadPipelineForOperator(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seus pitches em tempo real.</p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Em curso" value={kpis.inFlightCount} />
        <Kpi label="Won (30d)" value={kpis.won} tone="positive" />
        <Kpi label="Pensando (30d)" value={kpis.thinking} tone="neutral" />
        <Kpi label="Lost (30d)" value={kpis.lost} tone="muted" />
      </section>

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Em curso</h2>
        {inFlight.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhum pitch em curso. Toque em + para começar.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {inFlight.map((s) => {
              // Em curso (outcome=null) sempre tá em uma das 8 stages ativas;
              // os enums won/lost/etc. só rolam pós-outcome. Cast seguro.
              const stage = s.current_stage as Stage;
              const playbook = PIPELINE_PLAYBOOK[stage];
              return (
                <li key={s.id}>
                  <Link
                    href={`/pipeline/${s.id}/${stage}`}
                    className="block rounded-xl border border-border bg-card p-4 hover:bg-secondary"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {STAGE_LABEL[stage]} <span className="text-muted-foreground">· stage {playbook.order}/8</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Iniciado {formatRelative(s.created_at)}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {s.id.slice(0, 8)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Últimos 30 dias</h2>
          <ul className="mt-2 space-y-1">
            {recent.slice(0, 10).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <OutcomePill outcome={s.outcome} />
                  <span className="text-xs text-muted-foreground">{formatRelative(s.created_at)}</span>
                </span>
                {s.outcome_reason && (
                  <span className="text-xs text-muted-foreground">{s.outcome_reason}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href="/pipeline/new"
        aria-label="Novo pitch"
        title="Novo pitch"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90"
      >
        <Plus className="h-7 w-7" aria-hidden />
      </Link>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: 'positive' | 'neutral' | 'muted' }) {
  const accent =
    tone === 'positive' ? 'text-emerald-700' :
    tone === 'muted' ? 'text-muted-foreground' :
    tone === 'neutral' ? 'text-amber-700' :
    'text-foreground';
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function OutcomePill({ outcome }: { outcome: string | null }) {
  const map: Record<string, { label: string; className: string }> = {
    won: { label: 'Won', className: 'bg-emerald-100 text-emerald-800' },
    thinking: { label: 'Pensando', className: 'bg-amber-100 text-amber-800' },
    lost: { label: 'Lost', className: 'bg-secondary text-muted-foreground' },
    no_show: { label: 'No-show', className: 'bg-secondary text-muted-foreground' },
    archived: { label: 'Arquivado', className: 'bg-secondary text-muted-foreground' },
  };
  const v = (outcome && map[outcome]) || { label: '—', className: 'bg-secondary' };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${v.className}`}>{v.label}</span>;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const d = Math.floor(hr / 24);
  return `há ${d}d`;
}
