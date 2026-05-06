'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyEmailCta({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignored — fallback é o email visível
    }
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-base shadow-sm">
      <span className="font-mono text-sm">{email}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copiato' : 'Copia email'}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
