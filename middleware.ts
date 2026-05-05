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
 *   <custom-domain>                  → /sites/__custom__/* with x-custom-domain header
 *
 * For v1, KNOWN_ROOT_DOMAINS env var lists configured org roots (Edson's
 * 'factory.app' is the only one). Adding a new org = adding to that list +
 * inserting a row into `organizations`. No code change.
 *
 * The org_id resolution from root_domain is done at page level (RSC) since
 * middleware can't query DB without an extra fetch. Pages cache by host.
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

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost = req.headers.get('host') || '';
  const host = rawHost.replace(/:\d+$/, '').toLowerCase();

  const rootDomain = resolveRootDomain(host);

  // Unknown host → custom domain; page does DB lookup by host
  if (!rootDomain) {
    url.pathname = `/sites/byhost${url.pathname}`;
    const res = NextResponse.rewrite(url);
    res.headers.set('x-custom-domain', host);
    return res;
  }

  // Marketing root
  if (host === rootDomain || host === `www.${rootDomain}`) {
    url.pathname = `/marketing${url.pathname}`;
    const res = NextResponse.rewrite(url);
    res.headers.set('x-org-root-domain', rootDomain);
    return res;
  }

  // SaaS app
  if (host === `app.${rootDomain}`) {
    url.pathname = `/app${url.pathname}`;
    const res = NextResponse.rewrite(url);
    res.headers.set('x-org-root-domain', rootDomain);
    return res;
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
    const res = NextResponse.rewrite(url);
    res.headers.set('x-org-root-domain', rootDomain);
    res.headers.set('x-tenant-slug', sub);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|allergens/|images/).*)',
  ],
};
