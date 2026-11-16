// Debounced Firestore saves for tracking (T34): the cache shows each tap at once, and the record is
// written once the player pauses, so ten taps on "+" are one write. One pending save per build; the
// latest state wins. Pending saves are flushed when the page is hidden or closed, and when the build
// page unmounts.
import { saveTracking } from '@/lib/firebase';
import type { TrackingState } from '@/lib/tracking';

/** How long a change waits for the next one before it's written. */
export const SAVE_DELAY = 500;

interface PendingSave {
  uid: string;
  buildId: string;
  state: TrackingState;
  onError: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<string, PendingSave>();
const keyOf = (uid: string, buildId: string) => `${uid}/${buildId}`;

function run(key: string) {
  const save = pending.get(key);
  if (!save) return;
  clearTimeout(save.timer);
  pending.delete(key);
  saveTracking(save.uid, save.buildId, save.state).catch(save.onError);
}

/** Writes `state` after `delay` ms, replacing a save of the same build that's still waiting. */
export function scheduleSave(
  uid: string,
  buildId: string,
  state: TrackingState,
  onError: (error: unknown) => void,
  delay = SAVE_DELAY,
) {
  const key = keyOf(uid, buildId);
  clearTimeout(pending.get(key)?.timer);
  pending.set(key, { uid, buildId, state, onError, timer: setTimeout(() => run(key), delay) });
}

/** Drops a waiting save (the player stopped tracking). */
export function cancelSave(uid: string, buildId: string) {
  const key = keyOf(uid, buildId);
  clearTimeout(pending.get(key)?.timer);
  pending.delete(key);
}

/** Writes every waiting save now. */
export function flushSaves() {
  [...pending.keys()].forEach(run);
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', flushSaves);
