// Types for scripts/admin.mjs (used by tests/admin/).
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

export interface AdminTarget {
  buildId: string;
  commentId?: string | null;
}

export interface ReportGroup {
  buildId: string;
  commentId: string | null;
  reports: {
    id: string;
    reporterId: string;
    reason: string;
    note: string;
    createdAt: Date | null;
  }[];
  /** The reported build (name) or comment (text), or null when it no longer exists. */
  content: { authorId: string; text: string } | null;
}

export function listOpenReports(db: Firestore): Promise<ReportGroup[]>;

export function removeContent(
  db: Firestore,
  target: AdminTarget,
  options?: { write?: boolean; backupDir?: string },
): Promise<{ found: boolean; reports: number; backup: string | null }>;

export function dismissReports(
  db: Firestore,
  target: AdminTarget,
  options?: { write?: boolean },
): Promise<{ reports: number }>;

export function setAdmin(
  auth: Auth,
  who: string,
  admin: boolean,
  options?: { write?: boolean },
): Promise<{ uid: string; email: string | null; before: boolean; after: boolean }>;

/** Reads every document (subcollections included) into one JSON file in `dir`. */
export function exportAll(
  db: Firestore,
  options?: { dir?: string; projectId?: string | null },
): Promise<{ file: string; counts: Record<string, number>; total: number }>;

/** Changes a display name (trimmed, 1–40 characters) in the profile and the Auth user (T18). */
export function renameUser(
  db: Firestore,
  auth: Auth,
  uid: string,
  name: string,
  options?: { write?: boolean },
): Promise<{ uid: string; before: string; after: string }>;

/** Deletes an account (uid or email) and everything it published, backed up first (T18). */
export function deleteUserData(
  db: Firestore,
  auth: Auth,
  who: string,
  options?: { write?: boolean; backupDir?: string },
): Promise<{
  uid: string;
  email: string | null;
  authUser: boolean;
  profile: boolean;
  builds: number;
  likes: number;
  comments: number;
  reportsFiled: number;
  reportsResolved: number;
  backup: string | null;
}>;

export interface GameStatsCounts {
  buildCount: number;
  /** Distinct owners of the game's builds. */
  authorCount: number;
  /** Every account (users/ docs), whether or not it has builds. */
  userCount: number;
  /** Builds per tag. */
  tagCounts: Record<string, number>;
}

export const STATS_GAMES: string[];

/** One game's community numbers (T20). */
export function computeStats(db: Firestore, game: string): Promise<GameStatsCounts>;

/** Every game's stats; with `write`, saved to stats/<game> with a server `updatedAt` (T20). */
export function updateStats(
  db: Firestore,
  options?: { write?: boolean; games?: string[] },
): Promise<Record<string, GameStatsCounts>>;

/** A build's tracking counters (T36); null when the build has none yet (saved before T36). */
export interface TrackingCounts {
  playerCount: number | null;
  finishedCount: number | null;
}

/**
 * Recounts every build's playerCount and finishedCount from the tracking docs (T36); with `write`,
 * updates the builds that differ.
 */
export function recountTracking(
  db: Firestore,
  options?: { write?: boolean },
): Promise<{
  builds: number;
  trackingDocs: number;
  changes: { buildId: string; before: TrackingCounts; after: TrackingCounts }[];
}>;
