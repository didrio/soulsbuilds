// builds/{buildId}/comments/{id}. The build's commentCount (and lastCommentId, which tells the rules
// which comment changed) moves in the same batch.
import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Comment, CommentDoc } from '@/lib/models';
import { firestore } from './app';

const commentsCollection = (buildId: string) =>
  collection(firestore, 'builds', buildId, 'comments');
const buildRef = (buildId: string) => doc(firestore, 'builds', buildId);

function toComment(snapshot: QueryDocumentSnapshot): Comment {
  // Shape guaranteed by firestore.rules.
  const data = snapshot.data({ serverTimestamps: 'estimate' }) as CommentDoc;
  return {
    id: snapshot.id,
    authorId: data.authorId,
    text: data.text,
    createdAt: data.createdAt.toDate(),
  };
}

/** A build's comments, newest first. */
export async function listComments(buildId: string): Promise<Comment[]> {
  const snapshot = await getDocs(query(commentsCollection(buildId), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(toComment);
}

/** Posts a comment (text is trimmed) and resolves to it. */
export async function addComment(
  buildId: string,
  authorId: string,
  text: string,
): Promise<Comment> {
  const ref = doc(commentsCollection(buildId));
  const trimmed = text.trim();
  const batch = writeBatch(firestore);
  batch.set(ref, { authorId, text: trimmed, createdAt: serverTimestamp() });
  batch.update(buildRef(buildId), { commentCount: increment(1), lastCommentId: ref.id });
  await batch.commit();
  return { id: ref.id, authorId, text: trimmed, createdAt: new Date() };
}

/** Deletes a comment (its author, or an admin). */
export async function deleteComment(buildId: string, commentId: string): Promise<void> {
  const batch = writeBatch(firestore);
  batch.delete(doc(commentsCollection(buildId), commentId));
  batch.update(buildRef(buildId), { commentCount: increment(-1), lastCommentId: commentId });
  await batch.commit();
}
