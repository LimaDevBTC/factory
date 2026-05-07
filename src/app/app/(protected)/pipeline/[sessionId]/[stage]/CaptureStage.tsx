'use client';

import { useState, useTransition } from 'react';
import { ArrowRight } from 'lucide-react';
import type { PitchSession } from '@/lib/supabase/types';
import { VIBES, VIBE_CONFIG, type Vibe } from '@/lib/verticals';
import { RecordButton } from '@/components/pipeline/RecordButton';
import { PhotoUploader } from '@/components/pipeline/PhotoUploader';
import { submitCaptureAction } from '@/app/app/(protected)/pipeline/[sessionId]/capture-action';

const HOURS_PRESETS: Array<{ key: string; label: string; hint: string }> = [
  { key: 'lunch_dinner', label: 'Pranzo + cena', hint: 'Trattoria/ristorante padrão' },
  { key: 'lunch_only', label: 'Solo pranzo', hint: '12-15h Mon-Sab' },
  { key: 'dinner_only', label: 'Solo cena', hint: '19:30-23h diário' },
  { key: 'all_day', label: 'All day', hint: 'Bar/aperitivo 8-23h' },
  { key: 'cafe_morning', label: 'Cafeteria manhã', hint: '7-13h Mon-Sab' },
];

export function CaptureStage({ session }: { session: PitchSession }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await submitCaptureAction(session.id, formData);
      if (res && !res.ok) setError(res.message);
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <Section title="Identificação">
        <Field name="name" label="Nome do estabelecimento" required defaultValue="" />
        <SelectField name="vibe" label="Vibe (categoria)" required>
          {VIBES.map((v) => (
            <option key={v} value={v}>
              {VIBE_CONFIG[v as Vibe].label.it}
            </option>
          ))}
        </SelectField>
      </Section>

      <Section title="Endereço">
        <Field name="address" label="Indirizzo (rua + número)" />
        <div className="grid grid-cols-2 gap-3">
          <Field name="postal_code" label="CAP" />
          <Field name="city" label="Città" />
        </div>
        <Field name="province" label="Provincia (sigla)" placeholder="CS" />
      </Section>

      <Section title="Contato">
        <Field name="phone" label="Telefono" type="tel" />
        <Field name="whatsapp" label="WhatsApp" type="tel" />
        <Field
          name="contact_email"
          label="Email do dono (CRÍTICO)"
          type="email"
          required
          hint="Magic link, recibo PDF, suporte. Confirma 2x antes de enviar."
        />
        <Field
          name="public_email"
          label="Email público (info@, contatti@) — opcional"
          type="email"
          hint="Se diferente do pessoal, vai aparecer no rodapé do site"
        />
      </Section>

      <Section title="Fiscal">
        <Field
          name="partita_iva"
          label="Partita IVA"
          hint="Pergunta no fim, depois de criar rapport"
        />
      </Section>

      <Section title="Idiomas do site">
        <fieldset className="space-y-2">
          <legend className="sr-only">Idiomas habilitados</legend>
          <Checkbox name="enabled_locales" value="it" label="Italiano" defaultChecked disabled />
          <Checkbox name="enabled_locales" value="en" label="Inglês" defaultChecked />
          <Checkbox name="enabled_locales" value="de" label="Alemão" />
        </fieldset>
      </Section>

      <Section title="Horários">
        <fieldset className="space-y-2">
          <legend className="sr-only">Preset de horários</legend>
          {HOURS_PRESETS.map((p, i) => (
            <label key={p.key} className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 hover:bg-secondary">
              <input
                type="radio"
                name="hours_preset"
                value={p.key}
                defaultChecked={i === 0}
                required
                className="mt-0.5 h-4 w-4"
              />
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.hint}</p>
              </div>
            </label>
          ))}
        </fieldset>
        <p className="text-xs text-muted-foreground">
          Horário detalhado o dono ajusta no dashboard depois.
        </p>
      </Section>

      <Section title="🎙 Voz do dono (30s)">
        <p className="text-xs text-muted-foreground">
          Pede 30s ele descrevendo o lugar — alimenta a tagline.
        </p>
        <RecordButton
          sessionId={session.id}
          field="owner_voice"
          initialUrl={session.owner_voice_url}
          maxSeconds={45}
        />
      </Section>

      <Section title="📸 Fotos do menu">
        <p className="text-xs text-muted-foreground">
          Fachada (obrigatória), interior, dono atrás do balcão, menu/vitrine.
          Tira várias do menu — Claude vision lê melhor com 3+ ângulos.
        </p>
        <PhotoUploader sessionId={session.id} />
      </Section>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm transition disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Coleta completa → processar'}
        {!pending && <ArrowRight className="h-4 w-4" aria-hidden />}
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
  hint,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  defaultValue?: string;
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
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function SelectField({
  name,
  label,
  required,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="" disabled>Escolhe…</option>
        {children}
      </select>
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
        {disabled && <span className="ml-2 text-xs text-muted-foreground">(sempre ativo)</span>}
      </span>
    </label>
  );
}
