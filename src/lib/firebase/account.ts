// Account deletion (T18), client-side: the Spark plan has no Cloud Functions. Everything goes
// through the same rules as the rest of the app: counters on other people's builds move in the same
// batch as the like/comment they count. docs/decisions.md "Account deletion".
import { deleteUser } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  where,
  writeBatch,
  type DocumentReference,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { auth, firestore } from './app';
import { hasPassword, reauthenticate } from './auth';
import { deleteBuild, listUserBuilds } from './builds';
import { trackingStatus, type TrackingStatus } from '@/lib/tracking';
import { deleteTracking, listTracking } from './tracking';

/** What deleting an account removes, found before anything is deleted. */
export interface AccountData {
  buildIds: string[];
  /** The user's likes and comments on other people's builds, with whether that build still exists. */
  likes: { ref: DocumentReference; buildExists: boolean }[];
  comments: { ref: DocumentReference; buildExists: boolean }[];
  /** Their comment likes on other people's builds (T62), and the comment they like if it still exists. */
  commentLikes: { ref: DocumentReference; comment: DocumentReference | null }[];
  reports: DocumentReference[];
  /**
   * Their private progress on builds (T34), with what the build's counters include for it (T36):
   * its status, or `'none'` when the build is gone or is their own (deleted first).
   */
  tracking: { buildId: string; counted: TrackingStatus }[];
}

/** Steps done / total, for a progress line. */
export type AccountProgress = (done: number, total: number) => void;

async function withBuildExists(refs: DocumentReference[], ownBuilds: Set<string>) {
  // Likes/comments on the user's own builds go with those builds.
  const elsewhere = refs.filter((ref) => !ownBuilds.has(ref.parent.parent!.id));
  const exists = new Map<string, boolean>();
  await Promise.all(
    [...new Set(elsewhere.map((ref) => ref.parent.parent!.id))].map(async (buildId) => {
      exists.set(buildId, (await getDoc(doc(firestore, 'builds', buildId))).exists());
    }),
  );
  return elsewhere.map((ref) => ({ ref, buildExists: exists.get(ref.parent.parent!.id)! }));
}

async function withComment(likes: QueryDocumentSnapshot[], ownBuilds: Set<string>) {
  const elsewhere = likes.filter((like) => !ownBuilds.has(like.ref.parent.parent!.id));
  return Promise.all(
    elsewhere.map(async (like) => {
      // Shape guaranteed by firestore.rules.
      const { commentId } = like.data() as { commentId: string };
      const comment = doc(like.ref.parent.parent!, 'comments', commentId);
      return { ref: like.ref, comment: (await getDoc(comment)).exists() ? comment : null };
    }),
  );
}

/** Everything of the user's that account deletion removes. Only reads. */
export async function findAccountData(uid: string): Promise<AccountData> {
  const [builds, likes, comments, commentLikes, reports, tracking] = await Promise.all([
    listUserBuilds(uid),
    // Equality only (no orderBy, which would skip docs without the field): served by the
    // collection-group field overrides in firestore.indexes.json.
    getDocs(query(collectionGroup(firestore, 'likes'), where('userId', '==', uid))),
    getDocs(query(collectionGroup(firestore, 'comments'), where('authorId', '==', uid))),
    getDocs(query(collectionGroup(firestore, 'commentLikes'), where('userId', '==', uid))),
    getDocs(query(collection(firestore, 'reports'), where('reporterId', '==', uid))),
    listTracking(uid),
  ]);
  const ownBuilds = new Set(builds.map((build) => build.id));
  const elsewhere = tracking.filter(({ buildId }) => !ownBuilds.has(buildId));
  const existing = new Set(
    (
      await Promise.all(
        elsewhere.map(async ({ buildId }) =>
          (await getDoc(doc(firestore, 'builds', buildId))).exists() ? [buildId] : [],
        ),
      )
    ).flat(),
  );
  return {
    buildIds: [...ownBuilds],
    likes: await withBuildExists(
      likes.docs.map((d) => d.ref),
      ownBuilds,
    ),
    comments: await withBuildExists(
      comments.docs.map((d) => d.ref),
      ownBuilds,
    ),
    commentLikes: await withComment(commentLikes.docs, ownBuilds),
    reports: reports.docs.map((d) => d.ref),
    tracking: tracking.map(({ buildId, state }) => ({
      buildId,
      counted: existing.has(buildId) ? trackingStatus(state) : 'none',
    })),
  };
}

/**
 * Deletes everything the user has in Firestore: their builds (with every like and comment on them),
 * their likes and comments on other builds (moving those builds' counters), their comment likes
 * (moving the comments' counters, T62; before their comments, which they may have liked), their reports, their
 * tracking progress (T34; moving the tracked builds' counters, T36), and finally their profile. Everything is found first, so a failing query deletes nothing. Every step
 * is idempotent: if it stops halfway, running it again finishes the job.
 *
 * One like/comment per batch: the rules allow 20 document lookups per batched write, and two
 * comments on the same build can't share a batch (`lastCommentId` names one).
 */
export async function deleteAccountData(uid: string, onProgress?: AccountProgress): Promise<void> {
  const data = await findAccountData(uid);
  const total =
    data.buildIds.length +
    data.likes.length +
    data.comments.length +
    data.commentLikes.length +
    data.reports.length +
    data.tracking.length +
    1;
  let done = 0;
  const step = () => onProgress?.((done += 1), total);
  onProgress?.(0, total);

  for (const buildId of data.buildIds) {
    await deleteBuild(buildId);
    step();
  }
  for (const { ref, buildExists } of data.likes) {
    const batch = writeBatch(firestore);
    batch.delete(ref);
    if (buildExists) batch.update(ref.parent.parent!, { likeCount: increment(-1) });
    await batch.commit();
    step();
  }
  for (const { ref, comment } of data.commentLikes) {
    const batch = writeBatch(firestore);
    batch.delete(ref);
    if (comment) batch.update(comment, { likeCount: increment(-1) });
    await batch.commit();
    step();
  }
  for (const { ref, buildExists } of data.comments) {
    const batch = writeBatch(firestore);
    batch.delete(ref);
    if (buildExists) {
      batch.update(ref.parent.parent!, { commentCount: increment(-1), lastCommentId: ref.id });
    }
    await batch.commit();
    step();
  }
  for (const ref of data.reports) {
    await deleteDoc(ref);
    step();
  }
  for (const { buildId, counted } of data.tracking) {
    await deleteTracking(uid, buildId, counted);
    step();
  }
  await deleteDoc(doc(firestore, 'users', uid));
  step();
}

/**
 * Deletes the signed-in user's account: re-authenticates first (Auth refuses `deleteUser` after an old
 * sign-in, and checking first means a wrong password deletes nothing), with their password, or with
 * Google for a Google-only account (T30), then their data, then the Auth account, which signs them
 * out. Resolves to false, having deleted nothing, when they close the Google window.
 */
export async function deleteAccount(
  password: string | null,
  onProgress?: AccountProgress,
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user?.email) throw new FirebaseError('auth/user-not-found', 'Not signed in');
  if (!(await reauthenticate(hasPassword(user) ? (password ?? '') : null))) return false;
  await deleteAccountData(user.uid, onProgress);
  await deleteUser(user);
  return true;
}
