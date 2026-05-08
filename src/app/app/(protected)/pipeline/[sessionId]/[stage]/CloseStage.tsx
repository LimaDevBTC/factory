'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckCircle2, Clock, XCircle, UserX } from 'lucide-react';
import type { PitchSession } from '@/lib/supabase/types';
import { OUTCOME_REASONS_PT } from '@/lib/scripts';
import { setOutcomeAction } from '@/app/app/(protected)/pipeline/[sessionId]/pricing-action';

type Mode = 'idle' | 'thinking' | 'lost' | 'no_show';

export function CloseStage({ session, wonFlag }: { session: PitchSession; wonFlag: boolean }) {
  const [mode, setMode] = useState<Mode>('idle');
  const meta = (session.metadata as Record<string, unknown> | null) ?? {};
  const selectedPlan = meta.selected_plan as string | undefined;
  const selectedAmount = meta.selected_amount_cents as number | undefined;

  if (wonFlag) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
          <h2 className="mt-3 font-display text-2xl font-semibold text-emerald-900">
            Fechou!
          </h2>
          <p className="mt-2 text-sm text-emerald-900">
            Outcome registrado: <strong>won</strong>
            {selectedPlan && ` · ${selectedPlan.replace('prepaid_', '')}`}
            {selectedAmount && ` · €${(selectedAmount / 100).toFixed(0)}`}
          </p>
        </div>

        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">⚠️ T7 ainda não implementada</p>
          <p className="mt-1">
            Cash collection + checkboxes ToS/Privacy/DPA + recibo PDF + welcome email
            ainda em construção. Por enquanto:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
            <li>Outcome=&quot;won&quot; + selected_plan salvos no DB</li>
            <li>Tenant fica em status=&quot;draft&quot; até T7 confirmar cash</li>
            <li>Cliente NÃO recebe email ainda</li>
            <li>Site NÃO vai live ainda</li>
          </ul>
        </div>

        <a
          href="/pipeline"
          className="block h-12 w-full rounded-md border border-border bg-card text-center leading-[3rem] text-sm font-medium hover:bg-secondary"
        >
          Voltar pro pipeline
        </a>
      </div>
    );
  }

  if (mode === 'thinking') {
    return <ThinkingForm sessionId={session.id} onCancel={() => setMode('idle')} />;
  }
  if (mode === 'lost') {
    return <LostForm sessionId={session.id} onCancel={() => setMode('idle')} />;
  }
  if (mode === 'no_show') {
    return <NoShowForm sessionId={session.id} onCancel={() => setMode('idle')} />;
  }

  // Won submit (direto, sem modal)
  const wonAction = setOutcomeAction.bind(null, session.id, 'won', null, null, null);

  return (
    <div className="space-y-3">
      {selectedPlan && (
        <div className="rounded-md border border-border bg-card p-3 text-xs">
          Pacote selecionado: <strong>{selectedPlan.replace('prepaid_', '')}</strong>
          {selectedAmount && ` — €${(selectedAmount / 100).toFixed(0)}`}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Pergunta direta. Silêncio depois — não preencha o vazio.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={wonAction}>
          <OutcomeButton kind="won">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            Comprou
          </OutcomeButton>
        </form>
        <button
          type="button"
          onClick={() => setMode('thinking')}
          className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 text-base font-medium text-amber-900 hover:bg-amber-100"
        >
          <Clock className="h-5 w-5" aria-hidden />
          Vai pensar
        </button>
        <button
          type="button"
          onClick={() => setMode('lost')}
          className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card text-base font-medium text-muted-foreground hover:bg-secondary"
        >
          <XCircle className="h-5 w-5" aria-hidden />
          Não quis
        </button>
        <button
          type="button"
          onClick={() => setMode('no_show')}
          className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card text-base font-medium text-muted-foreground hover:bg-secondary"
        >
          <UserX className="h-5 w-5" aria-hidden />
          No-show
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Não tente reverter um &quot;não&quot; forte. Sai elegante — pode te indicar
        pro vizinho.
      </p>
    </div>
  );
}

function OutcomeButton({
  kind,
  children,
}: {
  kind: 'won';
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  const tone =
    kind === 'won'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
      : '';
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex h-20 w-full items-center justify-center gap-2 rounded-xl border-2 text-base font-medium transition disabled:opacity-50 ${tone}`}
    >
      {pending ? 'Registrando…' : children}
    </button>
  );
}

function ThinkingForm({
  sessionId,
  onCancel,
}: {
  sessionId: string;
  onCancel: () => void;
}) {
  const defaultFollowUp = new Date();
  defaultFollowUp.setDate(defaultFollowUp.getDate() + 3);
  const defaultFollowUpStr = defaultFollowUp.toISOString().slice(0, 16);

  return (
    <form
      action={async (fd) => {
        const notes = String(fd.get('notes') ?? '');
        const followUp = String(fd.get('follow_up_at') ?? '');
        await setOutcomeAction(sessionId, 'thinking', null, notes || null, followUp || null);
      }}
      className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/50 p-4"
    >
      <div className="flex items-center gap-2 text-amber-900">
        <Clock className="h-5 w-5" aria-hidden />
        <p className="font-medium">Vai pensar</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Preview link válido 30 dias. Follow-up automático será agendado.
      </p>

      <label className="block space-y-1">
        <span className="text-xs font-medium">Follow-up em</span>
        <input
          type="datetime-local"
          name="follow_up_at"
          defaultValue={defaultFollowUpStr}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium">Notas</span>
        <textarea
          name="notes"
          rows={3}
          placeholder="O que ele disse? Hesitou em quê?"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 flex-1 rounded-md border border-border bg-card text-sm hover:bg-secondary"
        >
          Cancelar
        </button>
        <SubmitMarker label="Salvar e voltar" />
      </div>
    </form>
  );
}

function LostForm({
  sessionId,
  onCancel,
}: {
  sessionId: string;
  onCancel: () => void;
}) {
  return (
    <form
      action={async (fd) => {
        const reason = String(fd.get('reason') ?? '') || null;
        const notes = String(fd.get('notes') ?? '') || null;
        await setOutcomeAction(sessionId, 'lost', reason, notes, null);
      }}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <XCircle className="h-5 w-5 text-muted-foreground" aria-hidden />
        <p className="font-medium">Não quis</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Motivo é dado: vai aparecer no funnel KPI pra ajustar a abordagem.
      </p>

      <fieldset className="space-y-1.5">
        <legend className="text-xs font-medium">Motivo</legend>
        {OUTCOME_REASONS_PT.map((r) => (
          <label key={r.key} className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-background p-2 text-sm hover:bg-secondary">
            <input type="radio" name="reason" value={r.key} required className="mt-0.5 h-4 w-4" />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>

      <label className="block space-y-1">
        <span className="text-xs font-medium">Notas (opcional)</span>
        <textarea
          name="notes"
          rows={2}
          placeholder="Qualquer detalhe pra você relembrar"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 flex-1 rounded-md border border-border bg-card text-sm hover:bg-secondary"
        >
          Cancelar
        </button>
        <SubmitMarker label="Salvar e voltar" />
      </div>
    </form>
  );
}

function NoShowForm({
  sessionId,
  onCancel,
}: {
  sessionId: string;
  onCancel: () => void;
}) {
  return (
    <form
      action={async (fd) => {
        const notes = String(fd.get('notes') ?? '') || null;
        await setOutcomeAction(sessionId, 'no_show', null, notes, null);
      }}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <UserX className="h-5 w-5 text-muted-foreground" aria-hidden />
        <p className="font-medium">No-show</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Dono saiu mid-pitch. Anote contexto se quiser tentar de novo depois.
      </p>

      <label className="block space-y-1">
        <span className="text-xs font-medium">Notas (opcional)</span>
        <textarea
          name="notes"
          rows={2}
          placeholder="Saiu pra atender, esposa apareceu, telefone tocou..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 flex-1 rounded-md border border-border bg-card text-sm hover:bg-secondary"
        >
          Cancelar
        </button>
        <SubmitMarker label="Salvar e voltar" />
      </div>
    </form>
  );
}

function SubmitMarker({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
    >
      {pending ? 'Salvando…' : label}
    </button>
  );
}
