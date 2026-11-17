// builds/{buildId}/comments/{id}. The build's commentCount (and lastCommentId, which tells the rules
// which comment changed) moves in the same batch. A reply (T62) names its top-level comment in
// parentId. Comment likes are builds/{buildId}/commentLikes/{commentId}_{uid}, with the comment's
// likeCount moving in the same batch.
import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Comment, CommentDoc } from '@/lib/models';
import { firestore } from './app';

const commentsCollection = (buildId: string) =>
  collection(firestore, 'builds', buildId, 'comments');
const buildRef = (buildId: string) => doc(firestore, 'builds', buildId);
const commentLikes = (buildId: string) => collection(firestore, 'builds', buildId, 'commentLikes');
const commentLikeRef = (buildId: string, commentId: string, userId: string) =>
  doc(commentLikes(buildId), `${commentId}_${userId}`);

function toComment(snapshot: QueryDocumentSnapshot): Comment {
  // Shape guaranteed by firestore.rules.
  const data = snapshot.data({ serverTimestamps: 'estimate' }) as CommentDoc;
  return {
    id: snapshot.id,
    authorId: data.authorId,
    text: data.text,
    // Comments from before T62 have neither field.
    parentId: data.parentId ?? null,
    likeCount: data.likeCount ?? 0,
    createdAt: data.createdAt.toDate(),
  };
}

/** A build's comments, newest first. */
export async function listComments(buildId: string): Promise<Comment[]> {
  const snapshot = await getDocs(query(commentsCollection(buildId), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(toComment);
}

/**
 * A build's newest comment, or null (T49: the phone's Comments header shows its start). One read:
 * cheaper than the list when the section stays closed.
 */
export async function fetchLatestComment(buildId: string): Promise<Comment | null> {
  const snapshot = await getDocs(
    query(commentsCollection(buildId), orderBy('createdAt', 'desc'), limit(1)),
  );
  const [first] = snapshot.docs;
  return first ? toComment(first) : null;
}

/**
 * Posts a comment (text is trimmed), or a reply when `parentId` names a top-level comment, and
 * resolves to it.
 */
export async function addComment(
  buildId: string,
  authorId: string,
  text: string,
  parentId: string | null = null,
): Promise<Comment> {
  const ref = doc(commentsCollection(buildId));
  const trimmed = text.trim();
  const batch = writeBatch(firestore);
  batch.set(ref, {
    authorId,
    text: trimmed,
    parentId,
    likeCount: 0,
    createdAt: serverTimestamp(),
  });
  batch.update(buildRef(buildId), { commentCount: increment(1), lastCommentId: ref.id });
  await batch.commit();
  return { id: ref.id, authorId, text: trimmed, parentId, likeCount: 0, createdAt: new Date() };
}

/** Deletes a comment (its author, or an admin). */
export async function deleteComment(buildId: string, commentId: string): Promise<void> {
  const batch = writeBatch(firestore);
  batch.delete(doc(commentsCollection(buildId), commentId));
  batch.update(buildRef(buildId), { commentCount: increment(-1), lastCommentId: commentId });
  await batch.commit();
}

/** Ids of the comments on a build that the user likes (one query per build page). */
export async function listCommentLikes(buildId: string, userId: string): Promise<Set<string>> {
  const snapshot = await getDocs(query(commentLikes(buildId), where('userId', '==', userId)));
  // Shape guaranteed by firestore.rules.
  return new Set(snapshot.docs.map((like) => (like.data() as { commentId: string }).commentId));
}

/** Likes a comment. Rejects if the user already likes it (the rules refuse a second like). */
export async function likeComment(
  buildId: string,
  commentId: string,
  userId: string,
): Promise<void> {
  const batch = writeBatch(firestore);
  batch.set(commentLikeRef(buildId, commentId, userId), {
    userId,
    commentId,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(commentsCollection(buildId), commentId), { likeCount: increment(1) });
  await batch.commit();
}

/** Removes the user's like from a comment. Rejects if there is none. */
export async function unlikeComment(
  buildId: string,
  commentId: string,
  userId: string,
): Promise<void> {
  const batch = writeBatch(firestore);
  batch.delete(commentLikeRef(buildId, commentId, userId));
  batch.update(doc(commentsCollection(buildId), commentId), { likeCount: increment(-1) });
  await batch.commit();
}
