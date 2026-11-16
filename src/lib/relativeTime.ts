// "3 days ago" for dates on rows, the build page and comments (T20). English, like the rest of the UI.

const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
] as const satisfies readonly (readonly [Intl.RelativeTimeFormatUnit, number])[];

const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/**
 * How long ago `date` was, in the largest whole unit: "just now" (under a minute, or a clock a little
 * ahead), "5 minutes ago", "yesterday", "3 days ago", "last week", "2 months ago", "last year".
 */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return format.format(-Math.floor(seconds / size), unit);
  }
  return 'just now';
}

const fullDate = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeStyle: 'short' });

/** The exact date and time, for a `<time>`'s title next to a relative date. */
export const formatFullDate = (date: Date) => fullDate.format(date);
