'use client';

import { useState, useTransition } from 'react';
import { sendMagicLinkAction } from './actions';

type State =
  | { kind: 'idle' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string };

export function LoginForm() {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    if (!email) {
      setState({ kind: 'error', message: 'Digite seu email.' });
      return;
    }
    startTransition(async () => {
      const res = await sendMagicLinkAction(email);
      if (res.ok) {
        setState({ kind: 'sent', email });
      } else {
        setState({ kind: 'error', message: res.message });
      }
    });
  }

  if (state.kind === 'sent') {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm font-medium">Link mágico enviado.</p>
        <p className="text-sm text-muted-foreground">
          Confira <span className="font-mono">{state.email}</span> e clique no link
          pra entrar. Pode demorar 1-2 min, dá uma olhada no spam se sumir.
        </p>
      </div>
    );
  }

  return (
    <form
      action={onSubmit}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email autorizado
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="seu@email.com"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm transition disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Enviar link mágico'}
      </button>
      {state.kind === 'error' && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}
