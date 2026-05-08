'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle, UserX, ExternalLink } from 'lucide-react';
import type { PitchSession } from '@/lib/supabase/types';
import { OUTCOME_REASONS_PT } from '@/lib/scripts';
import { setOutcomeAction } from '@/app/app/(protected)/pipeline/[sessionId]/pricing-action';
import { cashCloseAction } from '@/app/app/(protected)/pipeline/[sessionId]/cash-close-action';

type Mode = 'idle' | 'cash' | 'thinking' | 'lost' | 'no_show';

export function CloseStage({ session, wonFlag }: { session: PitchSession; wonFlag: boolean }) {
  const [mode, setMode] = useState<Mode>('idle');
  const meta = (session.metadata as Record<string, unknown> | null) ?? {};
  const selectedPlan = meta.selected_plan as string | undefined;
  const selectedAmount = meta.selected_amount_cents as number | undefined;
  const selectedMonths = meta.selected_months as number | undefined;

  if (wonFlag) {
    return <WonSuccess session={session} />;
  }

  if (mode === 'cash') {
    if (!selectedAmount) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Pacote não selecionado. Volta pra <Link href={`/pipeline/${session.id}/pricing`} className="underline">pricing</Link>.
        </div>
      );
    }
    return (
      <CashConfirmForm
        sessionId={session.id}
        amountCents={selectedAmount}
        months={selectedMonths ?? 6}
        plan={selectedPlan ?? 'prepaid_6mo'}
        onCancel={() => setMode('idle')}
      />
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
        <button
          type="button"
          onClick={() => setMode('cash')}
          className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 text-base font-medium text-emerald-900 hover:bg-emerald-100"
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          Comprou
        </button>
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
        Não tente reverter um &quot;não&quot; forte. Sai elegante.
      </p>
    </div>
  );
}

function WonSuccess({ session }: { session: PitchSession }) {
  const meta = (session.metadata as Record<string, unknown> | null) ?? {};
  const selectedPlan = meta.selected_plan as string | undefined;
  const selectedAmount = meta.selected_amount_cents as number | undefined;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
        <h2 className="mt-3 font-display text-2xl font-semibold text-emerald-900">
          Fechou! Site live, email enviado.
        </h2>
        <p className="mt-2 text-sm text-emerald-900">
          {selectedPlan && `${selectedPlan.replace('prepaid_', '')}`}
          {selectedAmount && ` · €${(selectedAmount / 100).toFixed(0)} contanti`}
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-4 text-sm">
        <p className="font-medium">Conferiu na DB:</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
          <li>tenant.status = &quot;live&quot;, published_at setado</li>
          <li>cash_collected_at + amount + by registrado</li>
          <li>service_period (start/end) calculado pelo plano</li>
          <li>withdrawal_window_ends_at = +14d (waiver gravado)</li>
          <li>terms/privacy/dpa accepted_at + version setados</li>
          <li>Welcome email com magic link enviado pro contact_email</li>
          <li>Recibo PDF gerado e linkado em cash_receipt_pdf_url</li>
        </ul>
      </div>

      <Link
        href="/pipeline"
        className="block h-12 w-full rounded-md border border-border bg-card text-center leading-[3rem] text-sm font-medium hover:bg-secondary"
      >
        Voltar pro pipeline
      </Link>
    </div>
  );
}

function CashConfirmForm({
  sessionId,
  amountCents,
  months,
  plan,
  onCancel,
}: {
  sessionId: string;
  amountCents: number;
  months: number;
  plan: string;
  onCancel: () => void;
}) {
  const action = cashCloseAction.bind(null, sessionId);
  const amountFmt = `€${(amountCents / 100).toFixed(0)}`;

  return (
    <form action={action} className="space-y-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/50 p-4">
      <input type="hidden" name="amount_cents" value={amountCents} />

      <div className="flex items-center gap-2 text-emerald-900">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        <p className="font-medium">Confirma cash collection</p>
      </div>

      <div className="rounded-md bg-white p-3 text-sm">
        <p>
          Pacote <strong>{plan.replace('prepaid_', '')} ({months} mesi)</strong> · valor{' '}
          <strong>{amountFmt}</strong>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Confirma os checkboxes com o dono na frente. Conta o dinheiro,
          ele conta de volta. Daí toca &quot;Confirma ricevuto&quot;.
        </p>
      </div>

      <fieldset className="space-y-3 rounded-md border border-border bg-white p-3">
        <Checkbox
          name="accept_terms"
          required
          label={
            <>
              Accetto i{' '}
              <Link href="/legal/terms" target="_blank" className="text-primary underline-offset-2 hover:underline">
                Termini di Servizio <ExternalLink className="inline h-3 w-3 align-baseline" aria-hidden />
              </Link>
            </>
          }
        />
        <Checkbox
          name="accept_privacy_dpa"
          required
          label={
            <>
              Accetto l&rsquo;
              <Link href="/legal/privacy" target="_blank" className="text-primary underline-offset-2 hover:underline">
                informativa Privacy <ExternalLink className="inline h-3 w-3 align-baseline" aria-hidden />
              </Link>
              {' '}e firmo il{' '}
              <Link href="/legal/dpa" target="_blank" className="text-primary underline-offset-2 hover:underline">
                DPA <ExternalLink className="inline h-3 w-3 align-baseline" aria-hidden />
              </Link>
            </>
          }
        />

        <div className="rounded-md border-2 border-amber-300 bg-amber-50 p-3">
          <Checkbox
            name="waive_withdrawal"
            required
            label={
              <span className="text-sm font-medium">
                Acconsento all&rsquo;esecuzione immediata del servizio (pubblicazione del sito) e
                riconosco di perdere il diritto di recesso una volta che il sito sia online.
                Codice del Consumo art. 59.
              </span>
            }
          />
        </div>

        <Checkbox
          name="marketing_consent"
          label="Voglio ricevere comunicazioni commerciali (facoltativo)"
        />
      </fieldset>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-md border border-border bg-white text-sm hover:bg-secondary"
        >
          Cancelar
        </button>
        <ConfirmCashSubmit amountFmt={amountFmt} />
      </div>
    </form>
  );
}

function Checkbox({
  name,
  label,
  required,
}: {
  name: string;
  label: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        required={required}
        className="mt-0.5 h-4 w-4 flex-shrink-0"
      />
      <span>{label}</span>
    </label>
  );
}

function ConfirmCashSubmit({ amountFmt }: { amountFmt: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 flex-[2] rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {pending ? 'Confirmando…' : `✅ Confirma ricevuto in contanti ${amountFmt}`}
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
          <label
            key={r.key}
            className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-background p-2 text-sm hover:bg-secondary"
          >
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
