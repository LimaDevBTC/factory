'use client';

import { useFormStatus } from 'react-dom';

export function AdvanceFormButton({
  label,
  pendingLabel = 'Avançando…',
  children,
}: {
  label: string;
  pendingLabel?: string;
  children?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm transition disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
      {!pending && children}
    </button>
  );
}
