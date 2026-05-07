import { ChevronRight } from 'lucide-react';
import type { StagePlaybook } from '@/lib/scripts';

/**
 * Card combinado: coaching PT (operator-facing) + cheat-sheet IT (texto pra
 * ler ao dono). Variantes IT em <details> collapse pra não poluir.
 */
export function ScriptCard({ playbook }: { playbook: StagePlaybook }) {
  return (
    <div className="space-y-4">
      <article className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Coaching</p>
        <div className="mt-2 whitespace-pre-line text-sm leading-relaxed">
          {playbook.coaching_pt}
        </div>
      </article>

      {playbook.italian_hint && (
        <article className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
            <span>🇮🇹</span>
            <span>Frase pra dizer ao dono</span>
          </p>
          <p className="mt-2 select-text font-display text-lg leading-snug">
            {playbook.italian_hint}
          </p>
        </article>
      )}

      {playbook.italian_variants && playbook.italian_variants.length > 0 && (
        <details className="group rounded-xl border border-border bg-card">
          <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium">
            <span>Variantes ({playbook.italian_variants.length})</span>
            <ChevronRight className="h-4 w-4 transition group-open:rotate-90" aria-hidden />
          </summary>
          <ul className="space-y-3 border-t border-border p-4">
            {playbook.italian_variants.map((v, i) => (
              <li key={i} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {v.label_pt}
                  {v.when_pt && <span className="font-normal"> · {v.when_pt}</span>}
                </p>
                <p className="select-text text-sm">{v.text}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
