import Image from 'next/image';
import { ALLERGEN_LABELS } from '@/lib/allergens';
import type { Allergen } from '@/lib/supabase/types';

export function AllergenBadges({
  allergens,
  locale,
}: {
  allergens: Allergen[];
  locale: 'it' | 'en' | 'de';
}) {
  if (!allergens.length) return null;
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Allergeni">
      {allergens.map((a) => {
        const label = ALLERGEN_LABELS[a];
        if (!label) return null;
        return (
          <li
            key={a}
            title={label[locale]}
            aria-label={label[locale]}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <Image src={label.icon} alt="" width={20} height={20} aria-hidden />
          </li>
        );
      })}
    </ul>
  );
}
