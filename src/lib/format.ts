export function formatPriceCents(cents: number, currency = 'EUR', locale = 'it-IT'): string {
  if (cents == null) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
