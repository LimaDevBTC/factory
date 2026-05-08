'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserOrgMembership } from '@/lib/tenant';

const PlanSchema = z.enum(['prepaid_3mo', 'prepaid_6mo', 'prepaid_12mo']);
const OutcomeSchema = z.enum(['won', 'thinking', 'lost', 'no_show']);

export const PLAN_PRICING = {
  prepaid_3mo: { months: 3, cents: 5000, plan_tier: 'starter' as const },
  prepaid_6mo: { months: 6, cents: 9900, plan_tier: 'starter' as const },
  prepaid_12mo: { months: 12, cents: 17900, plan_tier: 'starter' as const },
};

export type SelectedPlan = z.infer<typeof PlanSchema>;
export type CloseOutcome = z.infer<typeof OutcomeSchema>;

async function authorize(sessionId: string) {
  const session = await getCurrentUserOrgMembership();
  if (!session) redirect('/login');
  const supabase = createAdminClient();
  const { data: pitch } = await supabase
    .from('pitch_sessions')
    .select('id, operator_id, tenant_id, metadata, current_stage')
    .eq('id', sessionId)
    .eq('operator_id', session.user.id)
    .maybeSingle();
  if (!pitch) redirect('/pipeline?error=session_not_found');
  return { supabase, pitch };
}

/**
 * Salva o pacote selecionado em pitch_sessions.metadata e avança pra close.
 * Tenant também recebe billing_period+plan pra que o welcome email/recibo
 * (T7) saibam o que cobrar.
 */
export async function selectPlanAction(
  sessionId: string,
  plan: string,
  _formData?: FormData,
): Promise<void> {
  const planParse = PlanSchema.safeParse(plan);
  if (!planParse.success) {
    redirect(`/pipeline/${sessionId}/pricing?error=invalid_plan`);
  }
  const planKey = planParse.data;
  const pricing = PLAN_PRICING[planKey];

  const { supabase, pitch } = await authorize(sessionId);

  const meta = (pitch.metadata as Record<string, unknown> | null) ?? {};
  await supabase
    .from('pitch_sessions')
    .update({
      metadata: {
        ...meta,
        selected_plan: planKey,
        selected_amount_cents: pricing.cents,
        selected_months: pricing.months,
      },
    })
    .eq('id', sessionId);

  if (pitch.tenant_id) {
    await supabase
      .from('tenants')
      .update({
        plan: pricing.plan_tier,
        billing_period: planKey,
      })
      .eq('id', pitch.tenant_id);
  }

  // Avança pra close
  await supabase
    .from('pitch_sessions')
    .update({ current_stage: 'close' })
    .eq('id', sessionId);

  redirect(`/pipeline/${sessionId}/close`);
}

/**
 * Registra o outcome do pitch. Won fica preparado pra T7 (cash flow não
 * implementado ainda — site ainda em draft). Thinking/lost/no_show finalizam
 * a session e devolvem pro dashboard.
 */
export async function setOutcomeAction(
  sessionId: string,
  outcome: string,
  reason: string | null,
  notes: string | null,
  followUpAt: string | null,
  _formData?: FormData,
): Promise<void> {
  const outParse = OutcomeSchema.safeParse(outcome);
  if (!outParse.success) {
    redirect(`/pipeline/${sessionId}/close?error=invalid_outcome`);
  }
  const out = outParse.data;

  const { supabase } = await authorize(sessionId);

  const update: Record<string, unknown> = {
    outcome: out,
    outcome_at: new Date().toISOString(),
    current_stage: out, // schema permite outcome states no current_stage
  };
  if (reason && reason.trim()) update.outcome_reason = reason.trim();
  if (notes && notes.trim()) update.outcome_notes = notes.trim();
  if (followUpAt) {
    const parsed = new Date(followUpAt);
    if (!isNaN(parsed.getTime())) update.follow_up_at = parsed.toISOString();
  }

  await supabase.from('pitch_sessions').update(update).eq('id', sessionId);

  if (out === 'won') {
    // T7 vai pegar daqui — quando implementado, faz cash collection,
    // ToS/Privacy/DPA, recibo PDF, welcome email.
    redirect(`/pipeline/${sessionId}/close?won=1`);
  }
  redirect('/pipeline');
}
