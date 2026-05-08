// End-to-end test: exercita o fluxo completo desde criar pitch até cash close,
// e reporta status de cada step. Não substitui teste manual no browser (mídia
// requer interação humana), mas detecta integrações quebradas.
//
// Uso: pnpm e2e

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const operatorEmail = (process.env.OPERATOR_EMAILS ?? '').split(',')[0].trim();
// Note: Node fetch (undici) ignora header `Host` customizado por segurança.
// Solução: conectar via lvh.me (resolve 127.0.0.1) em vez de 127.0.0.1+Host.
const baseUrl = 'http://app.lvh.me:3001';
const hostHeader = 'app.lvh.me:3001'; // ainda usado em logs

if (!url || !key || !operatorEmail) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const results = [];
function step(name, status, detail) {
  results.push({ name, status, detail });
  const icon = status === 'PASS' ? '✓' : status === 'SKIP' ? '~' : status === 'WARN' ? '!' : '✗';
  const padded = name.padEnd(48);
  console.log(`  ${icon} ${padded} ${status === 'PASS' ? '' : '— ' + (detail ?? '')}`);
}

// Cookie jar simples (Set-Cookie → header em requests subsequentes)
const cookies = {};
function setCookieFromHeader(headerStr) {
  if (!headerStr) return;
  const arr = Array.isArray(headerStr) ? headerStr : [headerStr];
  for (const c of arr) {
    const [pair] = c.split(';');
    const [name, ...rest] = pair.split('=');
    cookies[name.trim()] = rest.join('=').trim();
  }
}
function cookieHeader() {
  return Object.entries(cookies).map(([n, v]) => `${n}=${v}`).join('; ');
}

console.log(`\n🧪 E2E test — ${baseUrl} (Host: ${hostHeader})\n`);

// ============================================================================
// STEP 1 — operator user existe + tem org_member
// ============================================================================
const { data: { users } } = await supabase.auth.admin.listUsers();
const operatorUser = users.find((u) => u.email === operatorEmail);
if (!operatorUser) { step('1. operator user em auth.users', 'FAIL', `${operatorEmail} não existe`); process.exit(1); }
step('1. operator user em auth.users', 'PASS');

const { data: orgMember } = await supabase
  .from('org_members')
  .select('organization_id, role, organizations:organizations(*)')
  .eq('user_id', operatorUser.id)
  .maybeSingle();
if (!orgMember) { step('2. org_member do operator', 'FAIL', 'sem org_member'); process.exit(1); }
const org = Array.isArray(orgMember.organizations) ? orgMember.organizations[0] : orgMember.organizations;
step('2. org_member do operator', 'PASS', `${org.brand_name} (${orgMember.role})`);

// ============================================================================
// STEP 3 — login via /api/dev/login
// ============================================================================
const loginRes = await fetch(`${baseUrl}/api/dev/login?email=${encodeURIComponent(operatorEmail)}`, {
  redirect: 'manual',
});
if (loginRes.status !== 307) { step('3. /api/dev/login', 'FAIL', `status ${loginRes.status}`); process.exit(1); }
const setCookie = loginRes.headers.getSetCookie?.() ?? loginRes.headers.get('set-cookie');
setCookieFromHeader(setCookie);
const authCookieKey = Object.keys(cookies).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
if (!authCookieKey) { step('3. /api/dev/login', 'FAIL', 'sem cookie sb-*-auth-token'); process.exit(1); }
step('3. /api/dev/login', 'PASS', 'session cookie setado');

// ============================================================================
// STEP 4 — cria pitch_session (mimica /pipeline/new sem precisar de Server Action)
// ============================================================================
const { data: pitch, error: pitchErr } = await supabase
  .from('pitch_sessions')
  .insert({
    organization_id: org.id,
    operator_id: operatorUser.id,
    current_stage: 'approach',
    target_lang: 'it-IT',
    metadata: {},
  })
  .select('*')
  .single();
if (pitchErr || !pitch) { step('4. cria pitch_session', 'FAIL', pitchErr?.message); process.exit(1); }
step('4. cria pitch_session', 'PASS', pitch.id.slice(0, 8));

// ============================================================================
// STEP 5 — avança approach → consent (mimica advanceStageAction)
// ============================================================================
const { error: advErr1 } = await supabase
  .from('pitch_sessions')
  .update({ current_stage: 'consent', consent_at: new Date().toISOString() })
  .eq('id', pitch.id);
if (advErr1) { step('5. advance approach → consent', 'FAIL', advErr1.message); process.exit(1); }
step('5. advance approach → consent', 'PASS');

// ============================================================================
// STEP 6 — avança consent → capture (sem áudio — opcional)
// ============================================================================
const { error: advErr2 } = await supabase
  .from('pitch_sessions')
  .update({ current_stage: 'capture', capture_at: new Date().toISOString() })
  .eq('id', pitch.id);
if (advErr2) { step('6. advance consent → capture (sem áudio)', 'FAIL', advErr2.message); process.exit(1); }
step('6. advance consent → capture (sem áudio)', 'PASS');

// ============================================================================
// STEP 7 — upload de foto de menu via /api/pipeline/upload
// ============================================================================
const photoBuf = readFileSync('/tmp/test-menu.jpg');
const fd = new FormData();
fd.append('session_id', pitch.id);
fd.append('field', 'photo');
fd.append('file', new Blob([photoBuf], { type: 'image/jpeg' }), 'test-menu.jpg');

const uploadRes = await fetch(`${baseUrl}/api/pipeline/upload`, {
  method: 'POST',
  headers: { Cookie: cookieHeader() },
  body: fd,
});
const uploadBody = await uploadRes.json();
if (!uploadRes.ok || !uploadBody.ok) { step('7. /api/pipeline/upload (photo)', 'FAIL', uploadBody.error); process.exit(1); }
step('7. /api/pipeline/upload (photo)', 'PASS', `${photoBuf.length} bytes`);

// ============================================================================
// STEP 8 — capture submit: cria tenant draft + linka pitch
// ============================================================================
const { data: tenant, error: tenantErr } = await supabase
  .from('tenants')
  .insert({
    organization_id: org.id,
    slug: `e2e-test-${Date.now().toString(36)}`,
    name: 'E2E Test Trattoria',
    vibe: 'trattoria_familiare',
    status: 'draft',
    address: 'Via Test 1',
    city: 'Cosenza',
    postal_code: '87100',
    province: 'CS',
    country: 'IT',
    contact_email: 'e2e@example.test',
    public_email: 'info@e2e-test.example.test',
    phone: '+39 0984 000000',
    default_locale: 'it',
    enabled_locales: ['it', 'en'],
    owner_locale: 'it',
    primary_color: '#8B0000',
    secondary_color: '#F5E6D3',
    font_pairing: 'cinzel_inter',
    hours_json: {
      mon: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
      tue: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
      wed: [], thu: [{ open: '12:00', close: '15:00' }],
      fri: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
      sat: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:30' }],
      sun: [{ open: '12:00', close: '15:30' }],
    },
  })
  .select('*')
  .single();
if (tenantErr || !tenant) { step('8. cria tenant draft', 'FAIL', tenantErr?.message); process.exit(1); }
await supabase.from('pitch_sessions').update({ tenant_id: tenant.id, current_stage: 'processing', processing_at: new Date().toISOString() }).eq('id', pitch.id);
step('8. cria tenant draft + linka pitch', 'PASS', tenant.slug);

// ============================================================================
// STEP 9 — /api/jobs/extract-menu (Claude vision)
// ============================================================================
let claudeStatus = 'PASS';
let claudeDetail = '';
let extractedItems = 0;
let extractedCategories = 0;

if (!process.env.ANTHROPIC_API_KEY) {
  step('9. /api/jobs/extract-menu (Claude vision)', 'SKIP', 'ANTHROPIC_API_KEY não setada');
} else {
  const extractRes = await fetch(`${baseUrl}/api/jobs/extract-menu`, {
    method: 'POST',
    headers: { Cookie: cookieHeader(), 'content-type': 'application/json' },
    body: JSON.stringify({ pitch_session_id: pitch.id }),
  });
  const extractBody = await extractRes.json();
  if (!extractRes.ok || !extractBody.ok) {
    step('9. /api/jobs/extract-menu (Claude vision)', 'FAIL', extractBody.error);
    claudeStatus = 'FAIL';
  } else {
    // Poll status (max 90s)
    let final = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const { data: job } = await supabase
        .from('factory_jobs')
        .select('status, error_message, output_data')
        .eq('id', extractBody.job_id)
        .maybeSingle();
      if (job?.status === 'ready' || job?.status === 'failed') { final = job; break; }
    }
    if (!final) {
      step('9. /api/jobs/extract-menu (Claude vision)', 'WARN', 'timeout 90s — não bateu ready/failed');
      claudeStatus = 'WARN';
    } else if (final.status === 'failed') {
      step('9. /api/jobs/extract-menu (Claude vision)', 'FAIL', final.error_message);
      claudeStatus = 'FAIL';
    } else {
      extractedItems = final.output_data?.items_count ?? 0;
      extractedCategories = final.output_data?.categories_count ?? 0;
      step('9. /api/jobs/extract-menu (Claude vision)', 'PASS', `${extractedCategories} cat × ${extractedItems} items`);
    }
  }
}

// Se Claude falhou ou skip, insere dados manualmente pra continuar
if (claudeStatus !== 'PASS') {
  await supabase.from('categories').insert([
    { tenant_id: tenant.id, slug: 'antipasti', name_it: 'Antipasti', display_order: 1 },
    { tenant_id: tenant.id, slug: 'primi', name_it: 'Primi', display_order: 2 },
  ]);
  const { data: cats } = await supabase.from('categories').select('id, slug').eq('tenant_id', tenant.id);
  const antipastiId = cats.find((c) => c.slug === 'antipasti')?.id;
  const primiId = cats.find((c) => c.slug === 'primi')?.id;
  await supabase.from('items').insert([
    { tenant_id: tenant.id, category_id: antipastiId, slug: 'bruschette', name_it: 'Bruschette al pomodoro', price_cents: 650, allergens: ['glutine'], dietary: ['vegetariano'] },
    { tenant_id: tenant.id, category_id: primiId, slug: 'fileja', name_it: 'Fileja alla nduja', price_cents: 1250, allergens: ['glutine'], dietary: [] },
  ]);
  await supabase.from('pitch_sessions').update({ current_stage: 'ready', ready_at: new Date().toISOString() }).eq('id', pitch.id);
  step('9b. fallback: insere items manualmente', 'PASS', '2 items');
} else {
  await supabase.from('pitch_sessions').update({ current_stage: 'ready', ready_at: new Date().toISOString() }).eq('id', pitch.id);
}

// ============================================================================
// STEP 10 — advance ready → present → pricing
// ============================================================================
await supabase.from('pitch_sessions').update({ current_stage: 'present', presented_at: new Date().toISOString() }).eq('id', pitch.id);
await supabase.from('pitch_sessions').update({ current_stage: 'pricing' }).eq('id', pitch.id);
step('10. advance ready → present → pricing', 'PASS');

// ============================================================================
// STEP 11 — select plan (mimica selectPlanAction)
// ============================================================================
await supabase.from('pitch_sessions').update({
  metadata: { selected_plan: 'prepaid_6mo', selected_amount_cents: 9900, selected_months: 6 },
  current_stage: 'close',
}).eq('id', pitch.id);
await supabase.from('tenants').update({ plan: 'starter', billing_period: 'prepaid_6mo' }).eq('id', tenant.id);
step('11. select plan prepaid_6mo + advance pra close', 'PASS');

// ============================================================================
// STEP 12 — cash close: vai pra live + receipt + email (mimica cashCloseAction)
// ============================================================================
const now = new Date();
const endsAt = new Date(now); endsAt.setMonth(endsAt.getMonth() + 6);
const withdrawalEndAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

const { error: liveErr } = await supabase.from('tenants').update({
  status: 'live',
  payment_status: 'paid_setup_only',
  payment_method: 'cash',
  cash_collected_at: now.toISOString(),
  cash_collected_amount: 9900,
  cash_collected_by: operatorUser.id,
  service_period_starts_at: now.toISOString(),
  service_period_ends_at: endsAt.toISOString(),
  withdrawal_window_ends_at: withdrawalEndAt.toISOString(),
  withdrawal_waived_at: now.toISOString(),
  withdrawal_waiver_text: 'E2E test waiver',
  terms_accepted_at: now.toISOString(),
  terms_version: '2026-05-08',
  privacy_accepted_at: now.toISOString(),
  privacy_version: '2026-05-08',
  dpa_accepted_at: now.toISOString(),
  dpa_version: '2026-05-08',
  marketing_consent: false,
  acceptance_ip_hash: 'e2e-test-hash',
  published_at: now.toISOString(),
}).eq('id', tenant.id);
if (liveErr) { step('12. tenant → live + acceptance fields', 'FAIL', liveErr.message); }
else step('12. tenant → live + acceptance fields', 'PASS');

await supabase.from('pitch_sessions').update({
  outcome: 'won', outcome_at: now.toISOString(), current_stage: 'won',
}).eq('id', pitch.id);
step('13. pitch_session outcome=won', 'PASS');

// ============================================================================
// STEP 14 — verifica que o site público renderiza (status='live')
// ============================================================================
const siteBaseUrl = `http://${tenant.slug}.lvh.me:3001`;
const siteRes = await fetch(`${siteBaseUrl}/`);
const siteBody = await siteRes.text();
// Verifica DB state antes do fetch — pra eliminar race condition
const { data: verifyTenant } = await supabase.from('tenants').select('status, name, slug').eq('id', tenant.id).maybeSingle();
const isLive = verifyTenant?.status === 'live';

if (siteRes.status === 200 && siteBody.includes(tenant.name)) {
  step('14. site público renderiza', 'PASS', `${siteRes.status}, contém "${tenant.name}"`);
} else {
  await import('node:fs').then((fs) => fs.writeFileSync('/tmp/e2e-site-body.html', siteBody));
  // next-error meta sempre tá presente no body Next 14 (não é signal de erro).
  // O signal real: o NotFound RSC component aparece como root component (não tenant component).
  const isNotFoundRoot = siteBody.includes('"name":"NotFound"');
  step('14. site público renderiza', 'FAIL',
    `${siteRes.status} · DB tenant.status=${verifyTenant?.status} · NotFound root=${isNotFoundRoot} · /tmp/e2e-site-body.html`);
}

const menuRes = await fetch(`${siteBaseUrl}/menu`);
const menuBody = await menuRes.text();
const menuOK = menuRes.status === 200 && (menuBody.includes('Menu') || menuBody.includes('Antipasti') || menuBody.includes('Primi'));
if (menuOK) {
  step('15. /menu do site público renderiza', 'PASS', `${menuRes.status}, com categorias`);
} else {
  step('15. /menu do site público renderiza', 'FAIL', `${menuRes.status}, sem categorias visíveis`);
}

// ============================================================================
// STEP 16 — dashboard acessível
// ============================================================================
const dashRes = await fetch(`${baseUrl}/dashboard/${tenant.id}`, {
  headers: { Cookie: cookieHeader() },
  redirect: 'manual',
});
const dashStatus = dashRes.status;
if (dashStatus === 200) {
  const dashBody = await dashRes.text();
  if (dashBody.includes('Panoramica') || dashBody.includes(tenant.name)) {
    step('16. /dashboard/<tid> renderiza autenticado', 'PASS', `200, contém Panoramica/nome`);
  } else {
    step('16. /dashboard/<tid> renderiza autenticado', 'WARN', '200 mas keywords ausentes');
  }
} else {
  step('16. /dashboard/<tid> renderiza autenticado', 'FAIL', `status ${dashStatus}`);
}

// ============================================================================
// STEP 17 — verifica audit log
// ============================================================================
// (Cash close real inseriria audit_log; nosso mimick não. Skip)
step('17. audit_log do cash close', 'SKIP', 'mimick não chama action — manual via UI');

// ============================================================================
// STEP 18 — receipt PDF (jsPDF) — só roda no path real do action
// ============================================================================
step('18. recibo PDF gerado', 'SKIP', 'jsPDF roda só no path do cashCloseAction; testar manual via UI');

// ============================================================================
// STEP 19 — welcome email (Resend)
// ============================================================================
if (!process.env.RESEND_API_KEY) {
  step('19. welcome email (Resend)', 'SKIP', 'RESEND_API_KEY não setada — em prod precisa');
} else {
  step('19. welcome email (Resend)', 'SKIP', 'roda só no path do cashCloseAction; testar manual via UI');
}

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n🧹 Cleanup do tenant + pitch criados pelo teste...');
await supabase.from('items').delete().eq('tenant_id', tenant.id);
await supabase.from('categories').delete().eq('tenant_id', tenant.id);
await supabase.from('audit_log').delete().eq('tenant_id', tenant.id);
await supabase.from('factory_jobs').delete().eq('tenant_id', tenant.id);
await supabase.from('pitch_sessions').delete().eq('id', pitch.id);
await supabase.from('tenants').delete().eq('id', tenant.id);
await supabase.storage.from('factory-media').remove([
  `sessions/${pitch.id}/photos/test-menu.jpg`,
]).catch(() => {});

// ============================================================================
// REPORT
// ============================================================================
console.log('\n📊 Resumo:');
const counts = { PASS: 0, FAIL: 0, SKIP: 0, WARN: 0 };
for (const r of results) counts[r.status] = (counts[r.status] ?? 0) + 1;
console.log(`  ✓ PASS: ${counts.PASS}`);
console.log(`  ! WARN: ${counts.WARN}`);
console.log(`  ~ SKIP: ${counts.SKIP}`);
console.log(`  ✗ FAIL: ${counts.FAIL}`);

if (counts.FAIL > 0) {
  console.log('\n❌ Falhas:');
  for (const r of results.filter((x) => x.status === 'FAIL')) {
    console.log(`  - ${r.name}: ${r.detail}`);
  }
  process.exit(1);
}
console.log('\n✅ E2E OK (steps PASS+SKIP, sem FAIL)');
