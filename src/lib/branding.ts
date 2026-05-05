import type { Tenant } from '@/lib/supabase/types';
import { VIBE_CONFIG } from '@/lib/verticals';

function escapeCssValue(v: string): string {
  return v.replace(/[<>"]/g, '');
}

/**
 * Render a `<style>` block with per-tenant CSS variables. Falls back to vibe defaults.
 * Used by site layout to theme primary/secondary colors and accent without
 * touching tailwind tokens (which stay neutral platform-wide).
 */
export function renderTenantStyle(tenant: Tenant): string {
  const vibe = VIBE_CONFIG[tenant.vibe];
  const primary = escapeCssValue(tenant.primary_color ?? vibe?.defaultColors.primary ?? '#8B0000');
  const secondary = escapeCssValue(tenant.secondary_color ?? vibe?.defaultColors.secondary ?? '#F5E6D3');
  return `
:root {
  --tenant-primary: ${primary};
  --tenant-secondary: ${secondary};
}
[data-vibe] .tenant-primary { color: var(--tenant-primary); }
[data-vibe] .tenant-bg-primary { background-color: var(--tenant-primary); color: #fff; }
[data-vibe] .tenant-bg-secondary { background-color: var(--tenant-secondary); }
[data-vibe] .tenant-border { border-color: var(--tenant-primary); }
`.trim();
}
