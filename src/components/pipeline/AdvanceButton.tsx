'use client';

import { useFormStatus } from 'react-dom';
import { ArrowRight } from 'lucide-react';
import { advanceStageAction } from '@/app/app/(protected)/pipeline/[sessionId]/actions';
import type { Stage } from '@/lib/scripts';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm transition disabled:opacity-50"
    >
      {pending ? 'Avançando…' : label}
      {!pending && <ArrowRight className="h-4 w-4" aria-hidden />}
    </button>
  );
}

export function AdvanceButton({
  sessionId,
  currentStage,
  label,
}: {
  sessionId: string;
  currentStage: Stage;
  label: string;
}) {
  const action = advanceStageAction.bind(null, sessionId, currentStage);
  return (
    <form action={action}>
      <Submit label={label} />
    </form>
  );
}
