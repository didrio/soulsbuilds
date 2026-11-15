// reports/{targetId}_{uid}: abuse reports on a build or a comment. Clients only create them (one
// per user per target); scripts/admin.mjs lists and resolves them. See firestore.rules.
import { FirebaseError } from 'firebase/app';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { ReportReason } from '@/lib/models';
import { firestore } from './app';

/** What is reported: a build, or one of its comments. */
export interface ReportTarget {
  buildId: string;
  commentId?: string;
}

export const reportId = (target: ReportTarget, reporterId: string) =>
  `${target.commentId ?? target.buildId}_${reporterId}`;

/**
 * Reports a build or comment. Resolves to 'already-reported' when this user reported it before
 * (the rules refuse a second report; the reporter may read their own to tell the cases apart).
 */
export async function reportContent(
  reporterId: string,
  target: ReportTarget,
  reason: ReportReason,
  note = '',
): Promise<'reported' | 'already-reported'> {
  const ref = doc(firestore, 'reports', reportId(target, reporterId));
  try {
    await setDoc(ref, {
      reporterId,
      buildId: target.buildId,
      commentId: target.commentId ?? null,
      reason,
      note: note.trim(),
      status: 'open',
      createdAt: serverTimestamp(),
    });
    return 'reported';
  } catch (error) {
    if (!(error instanceof FirebaseError) || error.code !== 'permission-denied') throw error;
    const existing = await getDoc(ref).catch(() => null);
    if (existing?.exists()) return 'already-reported';
    throw error;
  }
}
