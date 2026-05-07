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

/**
 * Mapa Stage → coluna timestamp no schema. Schema seta approach_at = now()
 * no insert; outras stages têm coluna mas começam null e a gente preenche
 * quando o operator avança PRA elas.
 */
const STAGE_AT_COLUMN: Partial<Record<Stage, string>> = {
  approach: 'approach_at',
  consent: 'consent_at',
  capture: 'capture_at',
  processing: 'processing_at',
  ready: 'ready_at',
  present: 'presented_at',
  // pricing/close não têm coluna dedicada — usam outcome_at quando finaliza
};

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

export async function advanceStageAction(
  sessionId: string,
  fromStage: Stage,
  _formData?: FormData,
): Promise<void> {
  const { supabase, pitch } = await authorizeSession(sessionId);

  if (pitch.current_stage !== fromStage) {
    redirect(`/pipeline/${sessionId}/${pitch.current_stage}`);
  }

  const next = nextStageFn(fromStage);
  if (!next) {
    redirect(`/pipeline/${sessionId}/${fromStage}?error=already_at_last_stage`);
  }

  const update: Record<string, unknown> = { current_stage: next };
  const stageAtCol = STAGE_AT_COLUMN[next];
  if (stageAtCol) update[stageAtCol] = new Date().toISOString();

  const { error } = await supabase.from('pitch_sessions').update(update).eq('id', sessionId);
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

  const update: Record<string, unknown> = { current_stage: target };
  const stageAtCol = STAGE_AT_COLUMN[target];
  if (stageAtCol) update[stageAtCol] = new Date().toISOString();

  const { error } = await supabase.from('pitch_sessions').update(update).eq('id', sessionId);
  if (error) {
    redirect(`/pipeline/${sessionId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/app/pipeline/${sessionId}`, 'layout');
  redirect(`/pipeline/${sessionId}/${target}`);
}
