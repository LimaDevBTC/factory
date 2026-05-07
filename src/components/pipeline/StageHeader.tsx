import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PIPELINE_STAGES, type Stage, PIPELINE_PLAYBOOK } from '@/lib/scripts';

export function StageHeader({ sessionId, stage }: { sessionId: string; stage: Stage }) {
  const playbook = PIPELINE_PLAYBOOK[stage];
  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between">
        <Link
          href="/pipeline"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          aria-label="Voltar pro pipeline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span>Pipeline</span>
        </Link>
        <span className="font-mono text-[10px] text-muted-foreground">
          {sessionId.slice(0, 8)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {PIPELINE_STAGES.map((s, i) => {
          const idx = PIPELINE_STAGES.indexOf(stage);
          const passed = i <= idx;
          return (
            <div
              key={s}
              className={
                'h-1.5 flex-1 rounded-full transition ' +
                (passed ? 'bg-primary' : 'bg-border')
              }
              aria-label={`Stage ${i + 1} of 8`}
            />
          );
        })}
      </div>

      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {playbook.title_pt}
        </h1>
        <p className="text-xs text-muted-foreground">
          {playbook.order} de {PIPELINE_STAGES.length}
        </p>
      </div>
    </header>
  );
}
