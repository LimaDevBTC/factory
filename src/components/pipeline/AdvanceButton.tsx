'use client';

import { useTransition } from 'react';
import { ArrowRight } from 'lucide-react';
import { advanceStageAction } from '@/app/app/(protected)/pipeline/[sessionId]/actions';
import type { Stage } from '@/lib/scripts';

export function AdvanceButton({
  sessionId,
  currentStage,
  label,
  disabled,
}: {
  sessionId: string;
  currentStage: Stage;
  label: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          await advanceStageAction(sessionId, currentStage);
        })
      }
      className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm transition disabled:opacity-50"
    >
      {pending ? 'Avançando…' : label}
      {!pending && <ArrowRight className="h-4 w-4" aria-hidden />}
    </button>
  );
}
