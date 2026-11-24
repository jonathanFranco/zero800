import type { Locale } from '@gamevault/shared';

export function timeAgo(locale: Locale, iso: string | null, now = Date.now()): string {
  if (!iso) return '';
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minutes = Math.round((Date.parse(iso) - now) / 60_000);
  if (minutes > -60) return relative.format(Math.min(minutes, -1), 'minute');
  if (minutes > -60 * 24) return relative.format(Math.round(minutes / 60), 'hour');
  return relative.format(Math.round(minutes / 1440), 'day');
}
