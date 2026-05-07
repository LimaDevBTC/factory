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
  if (!session) throw new Error('not_authenticated');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('pitch_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('operator_id', session.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('session_not_found_or_not_yours');

  return { session, supabase, pitch: data };
}

export async function advanceStageAction(sessionId: string, fromStage: Stage) {
  const { supabase, pitch } = await authorizeSession(sessionId);

  if (pitch.current_stage !== fromStage) {
    return { ok: false, message: `Stage atual é ${pitch.current_stage}, não ${fromStage}` };
  }

  const next = nextStageFn(fromStage);
  if (!next) {
    return { ok: false, message: 'Já estás no último stage.' };
  }

  const { error } = await supabase
    .from('pitch_sessions')
    .update({ current_stage: next, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/pipeline/${sessionId}`, 'layout');
  redirect(`/pipeline/${sessionId}/${next}`);
}

export async function setStageAction(sessionId: string, target: Stage) {
  if (!PIPELINE_STAGES.includes(target)) {
    return { ok: false, message: 'Stage inválido' };
  }
  const { supabase } = await authorizeSession(sessionId);
  const { error } = await supabase
    .from('pitch_sessions')
    .update({ current_stage: target, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/pipeline/${sessionId}`, 'layout');
  redirect(`/pipeline/${sessionId}/${target}`);
}
