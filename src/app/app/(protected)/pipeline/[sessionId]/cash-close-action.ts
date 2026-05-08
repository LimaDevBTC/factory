'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserOrgMembership } from '@/lib/tenant';
import { generateAndUploadReceipt, generateReceiptNumber } from '@/lib/receipt';
import { sendEmail } from '@/lib/email';
import WelcomeEmailIt from '@/emails/welcome.it';
import { PLAN_PRICING, type SelectedPlan } from './pricing-action';

const PLAN_LABELS: Record<SelectedPlan, string> = {
  prepaid_3mo: 'Starter 3 mesi',
  prepaid_6mo: 'Starter 6 mesi',
  prepaid_12mo: 'Starter 12 mesi',
};

const TERMS_VERSION = process.env.LEGAL_TERMS_VERSION ?? '2026-05-08';
const PRIVACY_VERSION = process.env.LEGAL_PRIVACY_VERSION ?? '2026-05-08';
const DPA_VERSION = process.env.LEGAL_DPA_VERSION ?? '2026-05-08';
const SUPPORT_EMAIL = process.env.RESEND_FROM?.match(/<(.+)>/)?.[1] ?? 'ciao@thefactory.life';

const WAIVER_TEXT_IT =
  "Acconsento all'esecuzione immediata del servizio (pubblicazione del sito) e " +
  "riconosco di perdere il diritto di recesso una volta che il sito sia online. " +
  "Codice del Consumo art. 59.";

const Body = z.object({
  accept_terms: z.literal('on'),
  accept_privacy_dpa: z.literal('on'),
  waive_withdrawal: z.literal('on'),
  marketing_consent: z.string().optional(),
  amount_cents: z.string().regex(/^\d+$/),
});

/**
 * Cash close: marca tenant.status='live', salva todos os campos de aceite
 * (terms/privacy/dpa versions, withdrawal waiver, marketing consent),
 * registra cash collection, gera recibo PDF, envia welcome email, finaliza
 * pitch_session com outcome='won'.
 *
 * Requer que selectPlanAction tenha rodado antes (selected_plan + amount em
 * pitch_sessions.metadata).
 */
export async function cashCloseAction(
  sessionId: string,
  formData: FormData,
): Promise<void> {
  const session = await getCurrentUserOrgMembership();
  if (!session) redirect('/login');

  const parsed = Body.safeParse({
    accept_terms: formData.get('accept_terms'),
    accept_privacy_dpa: formData.get('accept_privacy_dpa'),
    waive_withdrawal: formData.get('waive_withdrawal'),
    marketing_consent: formData.get('marketing_consent') ?? undefined,
    amount_cents: formData.get('amount_cents'),
  });
  if (!parsed.success) {
    redirect(`/pipeline/${sessionId}/close?error=missing_consent`);
  }
  const data = parsed.data;
  const amountCents = parseInt(data.amount_cents, 10);

  const supabase = createAdminClient();

  const { data: pitch } = await supabase
    .from('pitch_sessions')
    .select('id, operator_id, tenant_id, metadata')
    .eq('id', sessionId)
    .eq('operator_id', session.user.id)
    .maybeSingle();
  if (!pitch || !pitch.tenant_id) {
    redirect(`/pipeline/${sessionId}/close?error=no_tenant`);
  }
  const tenantId = pitch.tenant_id as string;

  const meta = (pitch.metadata as Record<string, unknown> | null) ?? {};
  const selectedPlan = meta.selected_plan as SelectedPlan | undefined;
  if (!selectedPlan) {
    redirect(`/pipeline/${sessionId}/pricing?error=plan_not_selected`);
  }
  const pricing = PLAN_PRICING[selectedPlan];

  const now = new Date();
  const startsAt = now;
  const endsAt = new Date(now);
  endsAt.setMonth(endsAt.getMonth() + pricing.months);
  const withdrawalEndAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Hash de IP+UA pra audit trail (não armazena em claro)
  const h = headers();
  const ua = (h.get('user-agent') ?? '').slice(0, 500);
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const salt = process.env.CONSENT_HASH_SALT ?? 'unsalted-dev-only';
  const ipHash = createHash('sha256').update(`${ip}|${ua}|${salt}`).digest('hex');

  // Atualiza tenant — primeiro grava acceptance + cash, depois flipa pra live
  // separado pra ter linha de audit limpa caso PDF/email falhem
  const { data: tenant, error: updErr } = await supabase
    .from('tenants')
    .update({
      status: 'live',
      payment_status: 'paid_setup_only',
      payment_method: 'cash',
      cash_collected_at: now.toISOString(),
      cash_collected_amount: amountCents,
      cash_collected_by: session.user.id,
      service_period_starts_at: startsAt.toISOString(),
      service_period_ends_at: endsAt.toISOString(),
      withdrawal_window_ends_at: withdrawalEndAt.toISOString(),
      withdrawal_waived_at: now.toISOString(),
      withdrawal_waiver_text: WAIVER_TEXT_IT,
      terms_accepted_at: now.toISOString(),
      terms_version: TERMS_VERSION,
      privacy_accepted_at: now.toISOString(),
      privacy_version: PRIVACY_VERSION,
      dpa_accepted_at: now.toISOString(),
      dpa_version: DPA_VERSION,
      marketing_consent: data.marketing_consent === 'on',
      acceptance_ip_hash: ipHash,
      acceptance_user_agent: ua,
      published_at: now.toISOString(),
    })
    .eq('id', tenantId)
    .select('id, slug, name, partita_iva, address, city, postal_code, contact_email, owner_locale')
    .single();
  if (updErr || !tenant) {
    redirect(`/pipeline/${sessionId}/close?error=${encodeURIComponent(updErr?.message ?? 'tenant_update_failed')}`);
  }

  // Audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_type: 'operator',
    actor_id: session.user.id,
    action: 'cash_close',
    metadata: {
      pitch_session_id: sessionId,
      plan: selectedPlan,
      amount_cents: amountCents,
      terms_version: TERMS_VERSION,
      privacy_version: PRIVACY_VERSION,
      dpa_version: DPA_VERSION,
    },
  });

  // Recibo PDF — best-effort; falha não bloqueia o close
  let receiptUrl: string | null = null;
  try {
    const fullAddress = [
      tenant.address,
      [tenant.postal_code, tenant.city].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(', ');
    const receipt = await generateAndUploadReceipt({
      tenantId,
      businessName: tenant.name,
      partitaIva: tenant.partita_iva,
      address: fullAddress || null,
      plan: PLAN_LABELS[selectedPlan],
      amountCents,
      paidAt: now,
      servicePeriodStart: startsAt,
      servicePeriodEnd: endsAt,
      withdrawalEndAt,
      receiptNumber: generateReceiptNumber(tenantId, now),
    });
    receiptUrl = receipt.url;
    await supabase
      .from('tenants')
      .update({ cash_receipt_pdf_url: receiptUrl })
      .eq('id', tenantId);
  } catch (e) {
    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      actor_type: 'system',
      action: 'cash_close.receipt_failed',
      metadata: { error: e instanceof Error ? e.message : 'unknown' },
    });
  }

  // Welcome email — best-effort; falha não bloqueia o close, mas registra
  if (tenant.contact_email) {
    const rootDomain = h.get('x-org-root-domain') ?? 'thefactory.life';
    const port = (h.get('host') ?? '').match(/:(\d+)$/)?.[1];
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const portSuffix = port ? `:${port}` : '';
    const siteUrl = `${proto}://${tenant.slug}.${rootDomain}${portSuffix}`;
    // Magic link real precisa do Supabase Auth — em v1, link pra /login com email pré-preenchido
    const dashboardLink = `${proto}://app.${rootDomain}${portSuffix}/login?email=${encodeURIComponent(tenant.contact_email)}`;

    const dateFmt = (d: Date) =>
      d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const amountFmt = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amountCents / 100);

    const result = await sendEmail({
      to: tenant.contact_email,
      subject: `Il tuo sito ${tenant.name} è online`,
      replyTo: SUPPORT_EMAIL,
      react: WelcomeEmailIt({
        businessName: tenant.name,
        siteUrl,
        dashboardMagicLink: dashboardLink,
        planLabel: PLAN_LABELS[selectedPlan],
        amountFormatted: amountFmt,
        servicePeriodEnd: dateFmt(endsAt),
        withdrawalWindowEnd: dateFmt(withdrawalEndAt),
        receiptUrl,
        legalVersions: {
          terms: TERMS_VERSION,
          privacy: PRIVACY_VERSION,
          dpa: DPA_VERSION,
        },
        supportEmail: SUPPORT_EMAIL,
      }),
    });

    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      actor_type: 'system',
      action: result.ok ? 'cash_close.email_sent' : 'cash_close.email_failed',
      metadata: result.ok
        ? { resend_id: result.id }
        : { reason: result.reason, error: 'error' in result ? result.error : null },
    });
  }

  // Finaliza pitch_session
  await supabase
    .from('pitch_sessions')
    .update({
      outcome: 'won',
      outcome_at: now.toISOString(),
      current_stage: 'won',
    })
    .eq('id', sessionId);

  redirect(`/pipeline/${sessionId}/close?won=1`);
}
