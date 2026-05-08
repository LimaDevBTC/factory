'use client';

import { useState, useTransition } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import type { Tenant } from '@/lib/supabase/types';
import { saveSettingsAction } from '@/app/app/dashboard/[tenantId]/settings-action';

export function SettingsForm({ tenant }: { tenant: Tenant }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);

  function onSubmit(fd: FormData) {
    setFeedback(null);
    startTransition(async () => {
      const res = await saveSettingsAction(tenant.id, fd);
      if (res.ok) setFeedback({ kind: 'ok', message: 'Modifiche salvate' });
      else setFeedback({ kind: 'error', message: res.message ?? 'Errore' });
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <Section title="Identità">
        <Field name="name" label="Nome del locale" defaultValue={tenant.name} required />
      </Section>

      <Section title="Contatti">
        <Field
          name="contact_email"
          label="Email del titolare (per il pannello)"
          type="email"
          defaultValue={tenant.contact_email ?? ''}
          required
          hint="Riceve magic link, ricevuta, supporto. Non appare sul sito pubblico."
        />
        <Field
          name="public_email"
          label="Email pubblica (sul sito)"
          type="email"
          defaultValue={tenant.public_email ?? ''}
          hint="Ad es. info@locale.it. Lasciare vuoto se uguale a quella del titolare."
        />
        <Field
          name="billing_email"
          label="Email per fatturazione"
          type="email"
          defaultValue={tenant.billing_email ?? ''}
          hint="Riceve fatture e ricevute. Lasciare vuoto se uguale a quella del titolare."
        />
        <Field name="phone" label="Telefono" type="tel" defaultValue={tenant.phone ?? ''} />
        <Field name="whatsapp" label="WhatsApp" type="tel" defaultValue={tenant.whatsapp ?? ''} />
      </Section>

      <Section title="Indirizzo">
        <Field name="address" label="Indirizzo" defaultValue={tenant.address ?? ''} />
        <div className="grid grid-cols-2 gap-3">
          <Field name="postal_code" label="CAP" defaultValue={tenant.postal_code ?? ''} />
          <Field name="city" label="Città" defaultValue={tenant.city ?? ''} />
        </div>
        <Field name="province" label="Provincia (sigla)" defaultValue={tenant.province ?? ''} />
      </Section>

      <Section title="Lingue del sito">
        <fieldset className="space-y-2">
          <Checkbox name="enabled_locales" value="it" label="Italiano" defaultChecked disabled />
          <Checkbox
            name="enabled_locales"
            value="en"
            label="Inglese"
            defaultChecked={tenant.enabled_locales.includes('en')}
          />
          <Checkbox
            name="enabled_locales"
            value="de"
            label="Tedesco"
            defaultChecked={tenant.enabled_locales.includes('de')}
          />
        </fieldset>
      </Section>

      {feedback && (
        <div
          className={
            'rounded-md border p-3 text-sm ' +
            (feedback.kind === 'ok'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-destructive/40 bg-destructive/5 text-destructive')
          }
        >
          {feedback.kind === 'ok' && <CheckCircle2 className="inline h-4 w-4 mr-1 align-text-bottom" aria-hidden />}
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-base font-medium text-primary-foreground disabled:opacity-50"
      >
        <Save className="h-4 w-4" aria-hidden />
        {pending ? 'Salvando…' : 'Salva modifiche'}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Checkbox({
  name,
  value,
  label,
  defaultChecked,
  disabled,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="h-4 w-4"
      />
      <span className="text-sm">
        {label}
        {disabled && <span className="ml-2 text-xs text-muted-foreground">(sempre attivo)</span>}
      </span>
    </label>
  );
}
