// Debounced Firestore saves for tracking (T34): the cache shows each tap at once, and the record is
// written once the player pauses, so ten taps on "+" are one write. One pending save per build; the
// latest state wins. Pending saves are flushed when the page is hidden or closed, and when the build
// page unmounts.
//
// The build's counters (T36) move with the record whenever its status changes, so each write needs
// the status the database has now. That's kept here per record: seeded from the read (`noteLoaded`),
// set when a write is sent (the SDK commits writes in order), and forgotten when one fails (the hook
// then refetches, which seeds it again).
import { deleteTracking, saveTracking } from '@/lib/firebase';
import { trackingStatus, type TrackingState, type TrackingStatus } from '@/lib/tracking';

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
/** The record's status in the database, as far as this tab knows. */
const stored = new Map<string, TrackingStatus>();
const keyOf = (uid: string, buildId: string) => `${uid}/${buildId}`;

/** Records what was just read from the database (null: no record). */
export function noteLoaded(uid: string, buildId: string, state: TrackingState | null) {
  stored.set(keyOf(uid, buildId), trackingStatus(state));
}

function run(key: string) {
  const save = pending.get(key);
  if (!save) return;
  clearTimeout(save.timer);
  pending.delete(key);
  const from = stored.get(key) ?? 'none';
  stored.set(key, trackingStatus(save.state));
  saveTracking(save.uid, save.buildId, save.state, from).catch((error: unknown) => {
    stored.delete(key);
    save.onError(error);
  });
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

/**
 * Stops tracking: drops a waiting save and deletes the record (moving the build's counters). Nothing
 * to delete when the record was never written.
 */
export async function deleteNow(uid: string, buildId: string): Promise<void> {
  const key = keyOf(uid, buildId);
  clearTimeout(pending.get(key)?.timer);
  pending.delete(key);
  const from = stored.get(key) ?? 'none';
  if (from === 'none') return;
  stored.set(key, 'none');
  try {
    await deleteTracking(uid, buildId, from);
  } catch (error) {
    stored.delete(key);
    throw error;
  }
}

/** Writes every waiting save now. */
export function flushSaves() {
  [...pending.keys()].forEach(run);
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', flushSaves);
