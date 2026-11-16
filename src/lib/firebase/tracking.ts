// users/{uid}/tracking/{buildId}: a player's private progress on a build (T34). Only its owner reads or
// writes it (firestore.rules). Tracking needs an account (T41): there is no signed-out progress.
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { GAME_ELDEN_RING, type TrackingDoc } from '@/lib/models';
import type { TrackingState } from '@/lib/tracking';
import { firestore } from './app';

const trackingRef = (uid: string, buildId: string) =>
  doc(firestore, 'users', uid, 'tracking', buildId);

/** The player's progress on a build, or null when they aren't tracking it. */
export async function getTracking(uid: string, buildId: string): Promise<TrackingState | null> {
  const snapshot = await getDoc(trackingRef(uid, buildId));
  if (!snapshot.exists()) return null;
  // Shape guaranteed by firestore.rules.
  const data = snapshot.data({ serverTimestamps: 'estimate' }) as TrackingDoc;
  return {
    collected: data.collected,
    seen: data.seen,
    stats: data.stats,
    startedAt: data.startedAt.toDate(),
    completedAt: data.completedAt?.toDate() ?? null,
  };
}

/** Writes the whole record (creating it when tracking starts). */
export async function saveTracking(
  uid: string,
  buildId: string,
  state: TrackingState,
): Promise<void> {
  await setDoc(trackingRef(uid, buildId), {
    game: GAME_ELDEN_RING,
    collected: state.collected,
    seen: state.seen,
    stats: state.stats,
    startedAt: Timestamp.fromDate(state.startedAt),
    updatedAt: serverTimestamp(),
    completedAt: state.completedAt ? Timestamp.fromDate(state.completedAt) : null,
  });
}

/** Stops tracking a build: its progress is deleted. */
export async function deleteTracking(uid: string, buildId: string): Promise<void> {
  await deleteDoc(trackingRef(uid, buildId));
}

/** Whether the user tracks any build (one read): the tracking intro shows until they do (T41). */
export async function tracksAnyBuild(uid: string): Promise<boolean> {
  const snapshot = await getDocs(query(collection(firestore, 'users', uid, 'tracking'), limit(1)));
  return !snapshot.empty;
}

/** Every tracking record of the user's (account deletion). */
export async function listTrackingRefs(uid: string): Promise<DocumentReference[]> {
  const snapshot = await getDocs(collection(firestore, 'users', uid, 'tracking'));
  return snapshot.docs.map((d) => d.ref);
}
