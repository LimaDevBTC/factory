import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Organization, Tenant, OrgRole } from '@/lib/supabase/types';

export async function getOrganizationByRootDomain(host: string): Promise<Organization | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('root_domain', host)
    .maybeSingle();
  if (data) return data as Organization;

  // Dev fallback: em v1 só temos uma org (factory-edson). Se o host bate com
  // KNOWN_ROOT_DOMAINS mas não bate exato com root_domain do DB (ex.: dev usa
  // lvh.me, prod usa thefactory.life), retorna a única org. Em prod com
  // múltiplas orgs isso ficaria errado — mas v1 é single-org.
  if (process.env.NODE_ENV === 'development') {
    const { data: anyOrg } = await supabase.from('organizations').select('*').limit(2);
    if (anyOrg && anyOrg.length === 1) return anyOrg[0] as Organization;
  }
  return null;
}

export async function getTenantBySlug(orgId: string, slug: string): Promise<Tenant | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('organization_id', orgId)
    .eq('slug', slug)
    .maybeSingle();
  return (data as Tenant) ?? null;
}

export async function getTenantByCustomDomain(host: string): Promise<Tenant | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('custom_domain', host)
    .maybeSingle();
  return (data as Tenant) ?? null;
}

export type CurrentUserMembership = {
  user: { id: string; email: string };
  organization: Organization;
  role: OrgRole;
};

export async function getCurrentUserOrgMembership(): Promise<CurrentUserMembership | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user || !user.email) return null;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from('org_members')
    .select('role, organization_id, organizations:organizations(*)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || !membership.organizations) return null;

  const org = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations;

  return {
    user: { id: user.id, email: user.email },
    organization: org as Organization,
    role: membership.role as OrgRole,
  };
}
