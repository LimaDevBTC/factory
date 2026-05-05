import { NextRequest, NextResponse } from 'next/server';

/**
 * Tenant resolution middleware — SaaS-multi-org-ready.
 *
 * Each Factory organization has its own root domain (e.g. 'factory.app' for
 * Edson, 'webfacil.com.br' for an operator in Brazil). The middleware extracts
 * the host, identifies the org root, and rewrites accordingly.
 *
 * Hostname patterns (per org):
 *   <org-root>                       → /marketing/*
 *   www.<org-root>                   → /marketing/*
 *   app.<org-root>                   → /app/*
 *   <slug>.<org-root>                → /sites/<slug>/*
 *   <custom-domain>                  → /sites/byhost/* with x-custom-domain header
 *
 * For v1, KNOWN_ROOT_DOMAINS env var lists configured org roots (Edson's
 * 'factory.app' is the only one). Adding a new org = adding to that list +
 * inserting a row into `organizations`. No code change.
 *
 * Headers set on the REQUEST so RSC `headers()` can read them. Setting on
 * the response only sends them back to the browser, which is not what
 * downstream RSCs read.
 */

const KNOWN_ROOT_DOMAINS = (process.env.KNOWN_ROOT_DOMAINS || 'factory.app,lvh.me')
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean);

const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'docs', 'status', 'mail', 'cdn', 'static', 'assets',
]);

function resolveRootDomain(host: string): string | null {
  if (KNOWN_ROOT_DOMAINS.includes(host)) return host;
  for (const root of KNOWN_ROOT_DOMAINS) {
    if (host.endsWith('.' + root)) return root;
  }
  return null;
}

function rewriteWithHeaders(
  url: URL,
  reqHeaders: Headers,
  extra: Record<string, string>,
) {
  const headers = new Headers(reqHeaders);
  for (const [k, v] of Object.entries(extra)) {
    headers.set(k, v);
  }
  return NextResponse.rewrite(url, { request: { headers } });
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost = req.headers.get('host') || '';
  const host = rawHost.replace(/:\d+$/, '').toLowerCase();

  const rootDomain = resolveRootDomain(host);

  // Unknown host → custom domain; page does DB lookup by host
  if (!rootDomain) {
    url.pathname = `/sites/byhost${url.pathname}`;
    return rewriteWithHeaders(url, req.headers, { 'x-custom-domain': host });
  }

  // Marketing root
  if (host === rootDomain || host === `www.${rootDomain}`) {
    url.pathname = `/marketing${url.pathname}`;
    return rewriteWithHeaders(url, req.headers, { 'x-org-root-domain': rootDomain });
  }

  // SaaS app
  if (host === `app.${rootDomain}`) {
    url.pathname = `/app${url.pathname}`;
    return rewriteWithHeaders(url, req.headers, { 'x-org-root-domain': rootDomain });
  }

  // Tenant subdomain
  if (host.endsWith(`.${rootDomain}`)) {
    const sub = host.slice(0, -1 - rootDomain.length);
    if (RESERVED_SUBDOMAINS.has(sub)) {
      return NextResponse.next();
    }
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(sub)) {
      return new NextResponse('Invalid hostname', { status: 400 });
    }
    url.pathname = `/sites/${sub}${url.pathname}`;
    return rewriteWithHeaders(url, req.headers, {
      'x-org-root-domain': rootDomain,
      'x-tenant-slug': sub,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|allergens/|images/).*)',
  ],
};
