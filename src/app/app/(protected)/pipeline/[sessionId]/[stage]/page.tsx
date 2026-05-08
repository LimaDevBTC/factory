import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserOrgMembership } from '@/lib/tenant';
import { PIPELINE_STAGES, PIPELINE_PLAYBOOK, type Stage } from '@/lib/scripts';
import type { PitchSession } from '@/lib/supabase/types';
import { StageHeader } from '@/components/pipeline/StageHeader';
import { ScriptCard } from '@/components/pipeline/ScriptCard';
import { AdvanceButton } from '@/components/pipeline/AdvanceButton';
import { ConsentStage } from './ConsentStage';
import { CaptureStage } from './CaptureStage';
import { ProcessingStage } from './ProcessingStage';
import { ReadyStage } from './ReadyStage';
import { PresentStage } from './PresentStage';
import { PricingStage } from './PricingStage';
import { CloseStage } from './CloseStage';

export const dynamic = 'force-dynamic';

function isStage(s: string): s is Stage {
  return (PIPELINE_STAGES as readonly string[]).includes(s);
}

export default async function StagePage({
  params,
  searchParams,
}: {
  params: { sessionId: string; stage: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Em vez de notFound() (que cai pro Next 404 default), renderiza painel de
  // erro PT — facilita diagnóstico se o redirect do action mandar pra path
  // inesperado.
  if (!isStage(params.stage)) {
    return <ErrorPanel reason={`Stage "${params.stage}" não existe.`} sessionId={params.sessionId} />;
  }
  const stage = params.stage as Stage;

  const session = await getCurrentUserOrgMembership();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data: pitch, error: pitchErr } = await supabase
    .from('pitch_sessions')
    .select('*')
    .eq('id', params.sessionId)
    .eq('operator_id', session.user.id)
    .maybeSingle();

  if (pitchErr) {
    return <ErrorPanel reason={`Erro DB: ${pitchErr.message}`} sessionId={params.sessionId} />;
  }
  if (!pitch) {
    return <ErrorPanel reason="Pitch session não encontrada (ou não é tua)." sessionId={params.sessionId} />;
  }
  const pitchSession = pitch as PitchSession;

  // Mantém URL alinhada ao stage atual (evita confusão se o user voltou pelo
  // history pra um stage que já passou).
  if (pitchSession.current_stage !== stage) {
    redirect(`/pipeline/${pitchSession.id}/${pitchSession.current_stage}`);
  }

  const playbook = PIPELINE_PLAYBOOK[stage];
  const errorParam = typeof searchParams.error === 'string' ? searchParams.error : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-32 sm:py-10">
      <StageHeader sessionId={pitchSession.id} stage={stage} />

      {errorParam && (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {decodeURIComponent(errorParam)}
        </div>
      )}

      <div className="mt-6 space-y-5">
        <ScriptCard playbook={playbook} />

        {stage === 'consent' && (
          <ConsentStage session={pitchSession} />
        )}

        {stage === 'capture' && (
          <CaptureStage session={pitchSession} />
        )}

        {stage === 'processing' && (
          <ProcessingStage session={pitchSession} />
        )}

        {stage === 'ready' && (
          <ReadyStage session={pitchSession} />
        )}

        {stage === 'present' && (
          <PresentStage session={pitchSession} />
        )}

        {stage === 'pricing' && (
          <PricingStage session={pitchSession} />
        )}

        {stage === 'close' && (
          <CloseStage session={pitchSession} wonFlag={searchParams.won === '1'} />
        )}
      </div>

      {/* Approach é só ScriptCard + advance. Outros stages têm form próprio que faz o advance. */}
      {stage === 'approach' && (
        <div className="mt-6">
          <AdvanceButton
            sessionId={pitchSession.id}
            currentStage={stage}
            label={playbook.next_button_pt}
          />
        </div>
      )}

    </div>
  );
}

function ErrorPanel({ reason, sessionId }: { reason: string; sessionId: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/pipeline"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span>Pipeline</span>
      </Link>
      <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 p-5 text-sm">
        <p className="font-medium text-destructive">Erro na pipeline stage</p>
        <p className="mt-1 text-foreground">{reason}</p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">session: {sessionId}</p>
      </div>
    </div>
  );
}
