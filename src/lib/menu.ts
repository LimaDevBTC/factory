import { createAdminClient } from '@/lib/supabase/admin';
import type { Category, Item } from '@/lib/supabase/types';

export type MenuData = {
  categories: Category[];
  itemsByCategoryId: Record<string, Item[]>;
  itemsUncategorized: Item[];
};

export async function loadMenu(tenantId: string): Promise<MenuData> {
  const supabase = createAdminClient();

  const [{ data: cats }, { data: items }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: true }),
    supabase
      .from('items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_available', true)
      .order('display_order', { ascending: true })
      .order('name_it', { ascending: true }),
  ]);

  const categories = (cats ?? []) as Category[];
  const allItems = (items ?? []) as Item[];

  const itemsByCategoryId: Record<string, Item[]> = {};
  const itemsUncategorized: Item[] = [];
  for (const item of allItems) {
    if (item.category_id) {
      (itemsByCategoryId[item.category_id] ??= []).push(item);
    } else {
      itemsUncategorized.push(item);
    }
  }

  return { categories, itemsByCategoryId, itemsUncategorized };
}

export type MenuFilters = {
  dietary: Set<string>;
  hideAllergens: Set<string>;
};

export function parseFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): MenuFilters {
  const toArr = (v: string | string[] | undefined): string[] => {
    if (!v) return [];
    return Array.isArray(v) ? v : v.split(',');
  };
  return {
    dietary: new Set(toArr(sp.d).filter(Boolean)),
    hideAllergens: new Set(toArr(sp.ha).filter(Boolean)),
  };
}

export function applyFilters(items: Item[], filters: MenuFilters): Item[] {
  return items.filter((item) => {
    for (const d of filters.dietary) {
      if (!item.dietary.includes(d as never)) return false;
    }
    for (const a of filters.hideAllergens) {
      if (item.allergens.includes(a as never)) return false;
    }
    return true;
  });
}
