import { notFound, redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserOrgMembership } from '@/lib/tenant';
import { PIPELINE_STAGES, PIPELINE_PLAYBOOK, type Stage } from '@/lib/scripts';
import type { PitchSession } from '@/lib/supabase/types';
import { StageHeader } from '@/components/pipeline/StageHeader';
import { ScriptCard } from '@/components/pipeline/ScriptCard';
import { AdvanceButton } from '@/components/pipeline/AdvanceButton';
import { ConsentStage } from './ConsentStage';
import { CaptureStage } from './CaptureStage';

export const dynamic = 'force-dynamic';

function isStage(s: string): s is Stage {
  return (PIPELINE_STAGES as readonly string[]).includes(s);
}

export default async function StagePage({
  params,
}: {
  params: { sessionId: string; stage: string };
}) {
  if (!isStage(params.stage)) notFound();
  const stage = params.stage as Stage;

  const session = await getCurrentUserOrgMembership();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data: pitch } = await supabase
    .from('pitch_sessions')
    .select('*')
    .eq('id', params.sessionId)
    .eq('operator_id', session.user.id)
    .maybeSingle();

  if (!pitch) notFound();
  const pitchSession = pitch as PitchSession;

  // Mantém URL alinhada ao stage atual (evita confusão se o user voltou pelo
  // history pra um stage que já passou).
  if (pitchSession.current_stage !== stage) {
    redirect(`/pipeline/${pitchSession.id}/${pitchSession.current_stage}`);
  }

  const playbook = PIPELINE_PLAYBOOK[stage];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-32 sm:py-10">
      <StageHeader sessionId={pitchSession.id} stage={stage} />

      <div className="mt-6 space-y-5">
        <ScriptCard playbook={playbook} />

        {stage === 'consent' && (
          <ConsentStage session={pitchSession} />
        )}

        {stage === 'capture' && (
          <CaptureStage session={pitchSession} />
        )}
      </div>

      {/* Approach é só ScriptCard + advance. Outros stages têm form/component próprio que faz o advance. */}
      {stage === 'approach' && (
        <div className="mt-6">
          <AdvanceButton
            sessionId={pitchSession.id}
            currentStage={stage}
            label={playbook.next_button_pt}
          />
        </div>
      )}

      {/* Outras stages (processing/ready/present/pricing/close) ainda não implementadas — T5+T6 */}
      {!['approach', 'consent', 'capture'].includes(stage) && (
        <div className="mt-6 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Stage <strong>{stage}</strong> é entregue em T5/T6. Em construção.
        </div>
      )}
    </div>
  );
}
