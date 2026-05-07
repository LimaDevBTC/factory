export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function pickUniqueSlug(
  base: string,
  organizationId: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const safe = slugify(base) || `tenant-${Math.random().toString(36).slice(2, 6)}`;
  if (!(await exists(safe))) return safe;
  for (let i = 2; i < 50; i++) {
    const candidate = `${safe}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${safe}-${Math.random().toString(36).slice(2, 6)}`;
}
