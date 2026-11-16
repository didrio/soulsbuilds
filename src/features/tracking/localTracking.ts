// Signed-out tracking (T34): progress per build in local storage, so tracking needs no account.
// `useSyncLocalTracking` moves it into the account on sign-up or log-in. Storage can be missing, full
// or blocked (private windows, cleared site data), so every access is guarded: then tracking simply
// starts empty.
import { STAT_KEYS, type Stats } from '@/lib/buildMath';
import type { TrackingState } from '@/lib/tracking';

const KEY = 'soulsbuilds.tracking.v1';

/** The owner in tracking query keys for signed-out progress (this module's storage). */
export const LOCAL_OWNER = 'local';
const LATER_KEY = 'soulsbuilds.keepProgress.later';

/** A TrackingState as JSON (dates as ISO strings). */
interface StoredTracking {
  collected: string[];
  seen: string[];
  stats: Stats;
  startedAt: string;
  completedAt: string | null;
}

const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isStats = (value: unknown): value is Stats =>
  typeof value === 'object' &&
  value !== null &&
  STAT_KEYS.every((key) => {
    const stat = (value as Record<string, unknown>)[key];
    return typeof stat === 'number' && Number.isInteger(stat) && stat >= 1 && stat <= 99;
  });

const isDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

/** A stored entry, or null if it's not one (hand-edited or from another version). */
function parseEntry(value: unknown): TrackingState | null {
  if (typeof value !== 'object' || value === null) return null;
  const entry = value as Partial<StoredTracking>;
  if (
    !isStrings(entry.collected) ||
    !isStrings(entry.seen) ||
    !isStats(entry.stats) ||
    !isDate(entry.startedAt) ||
    !(entry.completedAt === null || isDate(entry.completedAt))
  ) {
    return null;
  }
  return {
    collected: entry.collected,
    seen: entry.seen,
    stats: entry.stats,
    startedAt: new Date(entry.startedAt),
    completedAt: entry.completedAt ? new Date(entry.completedAt) : null,
  };
}

function readRaw(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function writeRaw(entries: Record<string, unknown>) {
  try {
    if (Object.keys(entries).length) localStorage.setItem(KEY, JSON.stringify(entries));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked or full: progress lasts for this page only.
  }
}

/** Every build tracked on this device, by build ID. */
export function readAllLocal(): Record<string, TrackingState> {
  return Object.fromEntries(
    Object.entries(readRaw()).flatMap(([buildId, value]) => {
      const entry = parseEntry(value);
      return entry ? [[buildId, entry]] : [];
    }),
  );
}

export const readLocal = (buildId: string): TrackingState | null => parseEntry(readRaw()[buildId]);

export function writeLocal(buildId: string, state: TrackingState) {
  const stored: StoredTracking = {
    ...state,
    startedAt: state.startedAt.toISOString(),
    completedAt: state.completedAt?.toISOString() ?? null,
  };
  writeRaw({ ...readRaw(), [buildId]: stored });
}

export function removeLocal(buildId: string) {
  const { [buildId]: _removed, ...rest } = readRaw();
  writeRaw(rest);
}

/** "Later" on the keep-your-progress card: hidden until the browser session ends. */
export function keepProgressLater(): boolean {
  try {
    return sessionStorage.getItem(LATER_KEY) === '1';
  } catch {
    return false;
  }
}

export function setKeepProgressLater() {
  try {
    sessionStorage.setItem(LATER_KEY, '1');
  } catch {
    // Not remembered: the card comes back on the next page.
  }
}
