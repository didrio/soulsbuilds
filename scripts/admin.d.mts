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
