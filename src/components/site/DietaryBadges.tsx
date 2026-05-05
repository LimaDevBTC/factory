import { DIETARY_LABELS, type Dietary } from '@/lib/allergens';

export function DietaryBadges({
  dietary,
  locale,
}: {
  dietary: Dietary[];
  locale: 'it' | 'en' | 'de';
}) {
  if (!dietary.length) return null;
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {dietary.map((d) => {
        const label = DIETARY_LABELS[d];
        if (!label) return null;
        return (
          <li
            key={d}
            className="rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            {label[locale]}
          </li>
        );
      })}
    </ul>
  );
}
