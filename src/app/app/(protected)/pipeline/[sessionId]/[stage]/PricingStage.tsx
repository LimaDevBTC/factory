'use client';

import { Star } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import type { PitchSession } from '@/lib/supabase/types';
import {
  selectPlanAction,
  PLAN_PRICING,
  type SelectedPlan,
} from '@/app/app/(protected)/pipeline/[sessionId]/pricing-action';

const PLANS: Array<{
  key: SelectedPlan;
  label: string;
  cents: number;
  perMonth: string;
  subtitle: string;
  popular?: boolean;
  bonus?: string;
}> = [
  {
    key: 'prepaid_3mo',
    label: '3 mesi',
    cents: PLAN_PRICING.prepaid_3mo.cents,
    perMonth: '€16,67/mese',
    subtitle: 'trial pago, entry-level',
  },
  {
    key: 'prepaid_6mo',
    label: '6 mesi',
    cents: PLAN_PRICING.prepaid_6mo.cents,
    perMonth: '€16,50/mese',
    subtitle: 'sweet spot',
  },
  {
    key: 'prepaid_12mo',
    label: '12 mesi',
    cents: PLAN_PRICING.prepaid_12mo.cents,
    perMonth: '€14,92/mese',
    subtitle: 'scelta più popolare',
    popular: true,
    bonus: 'dominio personalizzato incluso',
  },
];

function formatEur(cents: number): string {
  return `€${(cents / 100).toFixed(0)}`;
}

function PlanSubmit({
  cents,
  popular,
}: {
  cents: number;
  popular?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        'mt-3 h-10 w-full rounded-md text-sm font-medium transition disabled:opacity-50 ' +
        (popular ? 'tenant-bg-primary' : 'border border-border bg-card hover:bg-secondary')
      }
    >
      {pending ? 'Salvando…' : `Selecionar ${formatEur(cents)}`}
    </button>
  );
}

export function PricingStage({ session }: { session: PitchSession }) {
  const meta = (session.metadata as Record<string, unknown> | null) ?? {};
  const currentSelection = (meta.selected_plan as SelectedPlan | undefined) ?? null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Cliente escolheu? Toca o pacote que ele pediu — avança pro fechamento.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isSelected = currentSelection === plan.key;
          const action = selectPlanAction.bind(null, session.id, plan.key);
          return (
            <form
              action={action}
              key={plan.key}
              className={
                'rounded-xl border bg-card p-4 transition ' +
                (plan.popular
                  ? 'border-primary ring-1 ring-primary/30'
                  : 'border-border')
              }
            >
              {plan.popular && (
                <div className="mb-2 flex items-center gap-1 text-xs font-medium tenant-primary">
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                  <span>{plan.subtitle}</span>
                </div>
              )}
              <p className="font-display text-2xl font-semibold tracking-tight">
                {plan.label}
              </p>
              <p className="mt-1 font-display text-3xl font-bold tenant-primary">
                {formatEur(plan.cents)}
              </p>
              <p className="text-xs text-muted-foreground">{plan.perMonth} equiv</p>
              {!plan.popular && (
                <p className="mt-1 text-xs text-muted-foreground">{plan.subtitle}</p>
              )}
              {plan.bonus && (
                <p className="mt-2 rounded-md bg-primary/10 px-2 py-1 text-xs tenant-primary">
                  ✓ {plan.bonus}
                </p>
              )}
              {isSelected && (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  ← selecionado anteriormente
                </p>
              )}
              <PlanSubmit cents={plan.cents} popular={plan.popular} />
            </form>
          );
        })}
      </div>

      <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Lembretes:</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>NUNCA dê desconto não-solicitado</li>
          <li>NUNCA prometa lifetime</li>
          <li>Variantes IT (spinta_12mo, voucher, concorrenza) estão no card acima</li>
        </ul>
      </div>
    </div>
  );
}
