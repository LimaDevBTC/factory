'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowRight } from 'lucide-react';
import type { PitchSession } from '@/lib/supabase/types';
import { advanceStageAction } from '@/app/app/(protected)/pipeline/[sessionId]/actions';
import { RecordButton } from '@/components/pipeline/RecordButton';

function NextButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm transition disabled:opacity-50"
    >
      {pending ? 'Avançando…' : 'Consentimento gravado → próximo'}
      {!pending && <ArrowRight className="h-4 w-4" aria-hidden />}
    </button>
  );
}

export function ConsentStage({ session }: { session: PitchSession }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(session.consent_audio_url);
  const action = advanceStageAction.bind(null, session.id, 'consent');

  return (
    <div className="space-y-4">
      <RecordButton
        sessionId={session.id}
        field="consent_audio"
        initialUrl={audioUrl}
        maxSeconds={20}
        onUploaded={(url) => setAudioUrl(url)}
      />

      <form action={action}>
        <NextButton disabled={!audioUrl} />
      </form>

      {!audioUrl && (
        <p className="text-center text-xs text-muted-foreground">
          Grava o consentimento antes de avançar.
        </p>
      )}
    </div>
  );
}
