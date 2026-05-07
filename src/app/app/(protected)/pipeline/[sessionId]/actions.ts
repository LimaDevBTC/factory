'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserOrgMembership } from '@/lib/tenant';
import {
  PIPELINE_STAGES,
  nextStage as nextStageFn,
  type Stage,
} from '@/lib/scripts';

async function authorizeSession(sessionId: string) {
  const session = await getCurrentUserOrgMembership();
  if (!session) {
    redirect('/login');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('pitch_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('operator_id', session.user.id)
    .maybeSingle();
  if (error) {
    redirect(`/pipeline?error=${encodeURIComponent(error.message)}`);
  }
  if (!data) {
    redirect('/pipeline?error=session_not_found');
  }

  return { session, supabase, pitch: data };
}

/**
 * Avança o stage de fromStage pro próximo. Sempre redireciona — sucesso pra
 * stage seguinte, erro pra mesma stage com ?error= query.
 *
 * Assinatura inclui FormData opcional pra ser usável como `<form action>` via
 * `action.bind(null, sessionId, fromStage)`. Bind enche os 2 primeiros args;
 * form passa FormData como o terceiro (que ignoramos).
 */
export async function advanceStageAction(
  sessionId: string,
  fromStage: Stage,
  _formData?: FormData,
): Promise<void> {
  const { supabase, pitch } = await authorizeSession(sessionId);

  if (pitch.current_stage !== fromStage) {
    // URL desincronizada — redirect pra stage real
    redirect(`/pipeline/${sessionId}/${pitch.current_stage}`);
  }

  const next = nextStageFn(fromStage);
  if (!next) {
    redirect(`/pipeline/${sessionId}/${fromStage}?error=already_at_last_stage`);
  }

  const { error } = await supabase
    .from('pitch_sessions')
    .update({ current_stage: next, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) {
    redirect(`/pipeline/${sessionId}/${fromStage}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/app/pipeline/${sessionId}`, 'layout');
  redirect(`/pipeline/${sessionId}/${next}`);
}

export async function setStageAction(
  sessionId: string,
  target: Stage,
  _formData?: FormData,
): Promise<void> {
  if (!PIPELINE_STAGES.includes(target)) {
    redirect(`/pipeline/${sessionId}?error=invalid_stage`);
  }
  const { supabase } = await authorizeSession(sessionId);
  const { error } = await supabase
    .from('pitch_sessions')
    .update({ current_stage: target, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) {
    redirect(`/pipeline/${sessionId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/app/pipeline/${sessionId}`, 'layout');
  redirect(`/pipeline/${sessionId}/${target}`);
}
