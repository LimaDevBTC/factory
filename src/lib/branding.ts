import type { Tenant } from '@/lib/supabase/types';
import { VIBE_CONFIG } from '@/lib/verticals';
import { isFontPairing, pairingCssVars, type FontPairing } from '@/lib/fonts';

function escapeCssValue(v: string): string {
  return v.replace(/[<>"]/g, '');
}

/**
 * Render a `<style>` block with per-tenant CSS variables: branding colors and
 * the font pairing's display/body var aliases. Falls back to vibe defaults.
 *
 * The font CSS vars (`--font-inter`, `--font-cinzel`, etc.) come from
 * next/font classNames applied higher up; here we just alias the chosen pair
 * onto `--tenant-font-display` and `--tenant-font-body` so tailwind's
 * `font-display`/`font-sans` resolve to the right family for this tenant.
 */
export function renderTenantStyle(tenant: Tenant): string {
  const vibe = VIBE_CONFIG[tenant.vibe];
  const primary = escapeCssValue(tenant.primary_color ?? vibe?.defaultColors.primary ?? '#8B0000');
  const secondary = escapeCssValue(tenant.secondary_color ?? vibe?.defaultColors.secondary ?? '#F5E6D3');
  const pairing: FontPairing = isFontPairing(tenant.font_pairing)
    ? tenant.font_pairing
    : (vibe?.fontPairing as FontPairing) ?? 'cinzel_inter';
  const fonts = pairingCssVars(pairing);

  return `
[data-tenant="${tenant.id}"] {
  --tenant-primary: ${primary};
  --tenant-secondary: ${secondary};
  --tenant-font-display: ${fonts.display};
  --tenant-font-body: ${fonts.body};
}
[data-tenant="${tenant.id}"] .tenant-primary { color: var(--tenant-primary); }
[data-tenant="${tenant.id}"] .tenant-bg-primary { background-color: var(--tenant-primary); color: #fff; }
[data-tenant="${tenant.id}"] .tenant-bg-secondary { background-color: var(--tenant-secondary); }
[data-tenant="${tenant.id}"] .tenant-border { border-color: var(--tenant-primary); }
`.trim();
}

export function pairingForTenant(tenant: Tenant): FontPairing {
  if (isFontPairing(tenant.font_pairing)) return tenant.font_pairing;
  const vibe = VIBE_CONFIG[tenant.vibe];
  return (vibe?.fontPairing as FontPairing) ?? 'cinzel_inter';
}
