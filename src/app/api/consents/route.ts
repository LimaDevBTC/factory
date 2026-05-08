import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrganizationByRootDomain, getTenantBySlug, getTenantByCustomDomain } from '@/lib/tenant';

const Body = z.object({
  necessary: z.literal(true),
  analytics: z.boolean(),
  marketing: z.boolean(),
});

function hashVisitor(ip: string, ua: string): string {
  const salt = process.env.CONSENT_HASH_SALT ?? 'unsalted-dev-only';
  return createHash('sha256').update(`${ip}|${ua}|${salt}`).digest('hex');
}

const KNOWN_ROOTS = (process.env.KNOWN_ROOT_DOMAINS ?? 'lvh.me,thefactory.life')
  .split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);

function resolveRootDomain(host: string): string | null {
  if (KNOWN_ROOTS.includes(host)) return host;
  for (const root of KNOWN_ROOTS) {
    if (host.endsWith('.' + root)) return root;
  }
  return null;
}

/**
 * /api/* bypasses middleware (matcher excludes it) so we re-derive tenancy from
 * the raw Host header — same algorithm as middleware.ts. Falls back to
 * custom-domain lookup for unknown hosts.
 */
async function resolveTenantId(req: NextRequest): Promise<string | null> {
  const rawHost = req.headers.get('host') ?? '';
  const host = rawHost.replace(/:\d+$/, '').toLowerCase();
  if (!host) return null;

  const rootDomain = resolveRootDomain(host);
  if (!rootDomain) {
    const tenant = await getTenantByCustomDomain(host);
    return tenant?.id ?? null;
  }

  if (host === rootDomain || host === `www.${rootDomain}`) return null;
  if (host === `app.${rootDomain}`) return null;

  if (host.endsWith(`.${rootDomain}`)) {
    const slug = host.slice(0, -1 - rootDomain.length);
    const org = await getOrganizationByRootDomain(rootDomain);
    if (!org) return null;
    const tenant = await getTenantBySlug(org.id, slug);
    return tenant?.id ?? null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const tenantId = await resolveTenantId(req);
  if (!tenantId) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const ua = req.headers.get('user-agent') ?? '';
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const visitor_hash = hashVisitor(ip, ua);
  const locale = req.headers.get('accept-language')?.split(',')[0]?.slice(0, 5) ?? null;

  const supabase = createAdminClient();
  const { error } = await supabase.from('consents').insert({
    tenant_id: tenantId,
    visitor_hash,
    necessary: true,
    analytics: parsed.analytics,
    marketing: parsed.marketing,
    user_agent: ua.slice(0, 500),
    locale,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: 'persist_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
