import type { DayOfWeek, HoursJson, HoursSlot } from '@/lib/supabase/types';

const ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const CLOSED_LABEL: Record<'it' | 'en' | 'de', string> = {
  it: 'Chiuso',
  en: 'Closed',
  de: 'Geschlossen',
};

export function dayKeyForDate(d: Date): DayOfWeek {
  // Date.getDay(): 0=Sun..6=Sat. Map to mon-sun ordering.
  const idx = (d.getDay() + 6) % 7; // 0=Mon
  return ORDER[idx];
}

export function hoursOpenToday(hours: HoursJson | null): HoursSlot[] | null {
  if (!hours) return null;
  const key = dayKeyForDate(new Date());
  return hours[key] ?? [];
}

export function formatSlot(slot: HoursSlot): string {
  return `${slot.open}–${slot.close}`;
}

export function formatTodayHours(slots: HoursSlot[] | null, locale: 'it' | 'en' | 'de'): string {
  if (!slots) return '—';
  if (slots.length === 0) return CLOSED_LABEL[locale];
  return slots.map(formatSlot).join(' · ');
}

export function orderedHours(hours: HoursJson | null): Array<{ day: DayOfWeek; slots: HoursSlot[] }> {
  return ORDER.map((day) => ({ day, slots: hours?.[day] ?? [] }));
}
