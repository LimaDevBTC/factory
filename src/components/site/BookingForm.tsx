'use client';

import { useState, useTransition } from 'react';

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

type Messages = {
  name: string;
  phone: string;
  email: string;
  party_size: string;
  requested_at: string;
  notes: string;
  consent: string;
  marketing: string;
  submit: string;
  submitting: string;
  success_title: string;
  success_body: string;
  error_generic: string;
};

export function BookingForm({ messages, locale }: { messages: Messages; locale: string }) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const customer_name = String(formData.get('name') ?? '').trim();
    const customer_phone = String(formData.get('phone') ?? '').trim();
    const customer_email = String(formData.get('email') ?? '').trim();
    const party_size = Number(formData.get('party_size') ?? 0);
    const requested_at_local = String(formData.get('requested_at') ?? '');
    const notes = String(formData.get('notes') ?? '').trim();
    const consent = formData.get('consent') === 'on';
    const marketing = formData.get('marketing') === 'on';

    if (!consent) {
      setState({ kind: 'error', message: messages.error_generic });
      return;
    }

    const requested_at = new Date(requested_at_local).toISOString();

    startTransition(async () => {
      setState({ kind: 'submitting' });
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            customer_name,
            customer_email,
            customer_phone,
            party_size,
            requested_at,
            notes,
            locale,
            consent: true,
            marketing,
          }),
        });
        const body = await res.json();
        if (res.ok && body.ok) setState({ kind: 'ok' });
        else setState({ kind: 'error', message: messages.error_generic });
      } catch {
        setState({ kind: 'error', message: messages.error_generic });
      }
    });
  }

  if (state.kind === 'ok') {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <h2 className="font-display text-xl font-semibold">{messages.success_title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{messages.success_body}</p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field name="name" label={messages.name} required autoComplete="name" />
      <Field name="phone" label={messages.phone} type="tel" required autoComplete="tel" />
      <Field name="email" label={messages.email} type="email" autoComplete="email" />
      <Field name="party_size" label={messages.party_size} type="number" min="1" max="50" required defaultValue="2" />
      <Field name="requested_at" label={messages.requested_at} type="datetime-local" required />
      <Field name="notes" label={messages.notes} as="textarea" />

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4" />
        <span className="text-muted-foreground">{messages.consent}</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="marketing" className="mt-1 h-4 w-4" />
        <span className="text-muted-foreground">{messages.marketing}</span>
      </label>

      <button
        type="submit"
        disabled={pending || state.kind === 'submitting'}
        className="h-12 w-full rounded-md tenant-bg-primary text-base font-medium shadow-sm disabled:opacity-50"
      >
        {state.kind === 'submitting' ? messages.submitting : messages.submit}
      </button>
      {state.kind === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  autoComplete,
  min,
  max,
  defaultValue,
  as = 'input',
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  min?: string;
  max?: string;
  defaultValue?: string;
  as?: 'input' | 'textarea';
}) {
  const baseClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {as === 'textarea' ? (
        <textarea name={name} className={baseClass} rows={3} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          min={min}
          max={max}
          defaultValue={defaultValue}
          className={baseClass + ' h-11'}
        />
      )}
    </label>
  );
}
