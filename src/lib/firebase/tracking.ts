// users/{uid}/tracking/{buildId}: a player's private progress on a build (T34). Only its owner reads or
// writes it (firestore.rules). Tracking needs an account (T41): there is no signed-out progress.
// The build's public counters (playerCount, finishedCount; T36) move in the same batch whenever the
// doc's status changes (started, finished, un-finished, stopped), which the rules require.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type DocumentSnapshot,
  type WriteBatch,
} from 'firebase/firestore';
import { GAME_ELDEN_RING, type TrackingDoc } from '@/lib/models';
import {
  counterDelta,
  trackingStatus,
  type TrackingState,
  type TrackingStatus,
} from '@/lib/tracking';
import { firestore } from './app';

const trackingRef = (uid: string, buildId: string) =>
  doc(firestore, 'users', uid, 'tracking', buildId);

/** One of the player's tracked builds: the build's id and their progress on it. */
export interface TrackedBuild {
  buildId: string;
  state: TrackingState;
}

function toTrackingState(snapshot: DocumentSnapshot): TrackingState {
  // Shape guaranteed by firestore.rules.
  const data = snapshot.data({ serverTimestamps: 'estimate' }) as TrackingDoc;
  return {
    collected: data.collected,
    seen: data.seen,
    marked: data.marked ?? [],
    stats: data.stats,
    startedAt: data.startedAt.toDate(),
    completedAt: data.completedAt?.toDate() ?? null,
  };
}

/** The player's progress on a build, or null when they aren't tracking it. */
export async function getTracking(uid: string, buildId: string): Promise<TrackingState | null> {
  const snapshot = await getDoc(trackingRef(uid, buildId));
  return snapshot.exists() ? toTrackingState(snapshot) : null;
}

/** Adds the counter change for a status change to the batch (nothing when the status is the same). */
function moveCounters(
  batch: WriteBatch,
  buildId: string,
  from: TrackingStatus,
  to: TrackingStatus,
) {
  const { playerCount, finishedCount } = counterDelta(from, to);
  if (!playerCount && !finishedCount) return;
  batch.update(doc(firestore, 'builds', buildId), {
    ...(playerCount ? { playerCount: increment(playerCount) } : {}),
    ...(finishedCount ? { finishedCount: increment(finishedCount) } : {}),
  });
}

/**
 * Writes the whole record (creating it when tracking starts). `from` is the status the database has
 * now (`'none'` before the first save), so the build's counters move with it.
 */
export async function saveTracking(
  uid: string,
  buildId: string,
  state: TrackingState,
  from: TrackingStatus,
): Promise<void> {
  const batch = writeBatch(firestore);
  batch.set(trackingRef(uid, buildId), {
    game: GAME_ELDEN_RING,
    collected: state.collected,
    seen: state.seen,
    marked: state.marked,
    stats: state.stats,
    startedAt: Timestamp.fromDate(state.startedAt),
    updatedAt: serverTimestamp(),
    completedAt: state.completedAt ? Timestamp.fromDate(state.completedAt) : null,
  });
  moveCounters(batch, buildId, from, trackingStatus(state));
  await batch.commit();
}

/**
 * Stops tracking a build: its progress is deleted, and the build's counters drop by what `counted`
 * says the doc was (`'none'` when the build is gone, so there's nothing to count down).
 */
export async function deleteTracking(
  uid: string,
  buildId: string,
  counted: TrackingStatus,
): Promise<void> {
  const batch = writeBatch(firestore);
  batch.delete(trackingRef(uid, buildId));
  moveCounters(batch, buildId, counted, 'none');
  await batch.commit();
}

/** Whether the user tracks any build (one read): the tracking intro shows until they do (T41). */
export async function tracksAnyBuild(uid: string): Promise<boolean> {
  const snapshot = await getDocs(query(collection(firestore, 'users', uid, 'tracking'), limit(1)));
  return !snapshot.empty;
}

/** Every build the user tracks, with their progress (the profile's Playing and Completed, T36). */
export async function listTracking(uid: string): Promise<TrackedBuild[]> {
  const snapshot = await getDocs(collection(firestore, 'users', uid, 'tracking'));
  return snapshot.docs.map((d) => ({ buildId: d.id, state: toTrackingState(d) }));
}
