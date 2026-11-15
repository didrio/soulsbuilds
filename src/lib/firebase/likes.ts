// builds/{buildId}/likes/{uid}: one doc per like. The build's likeCount changes in the same batch,
// which firestore.rules requires.
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from './app';

const likeRef = (buildId: string, userId: string) =>
  doc(firestore, 'builds', buildId, 'likes', userId);
const buildRef = (buildId: string) => doc(firestore, 'builds', buildId);

export async function hasLiked(buildId: string, userId: string): Promise<boolean> {
  const snapshot = await getDoc(likeRef(buildId, userId));
  return snapshot.exists();
}

/** Likes a build. Rejects if the user already likes it (the rules refuse a second like). */
export async function likeBuild(buildId: string, userId: string): Promise<void> {
  const batch = writeBatch(firestore);
  batch.set(likeRef(buildId, userId), { userId, createdAt: serverTimestamp() });
  batch.update(buildRef(buildId), { likeCount: increment(1) });
  await batch.commit();
}

/** Removes the user's like. Rejects if there is no like to remove. */
export async function unlikeBuild(buildId: string, userId: string): Promise<void> {
  const batch = writeBatch(firestore);
  batch.delete(likeRef(buildId, userId));
  batch.update(buildRef(buildId), { likeCount: increment(-1) });
  await batch.commit();
}

/** Ids of the builds a user liked, most recent first (collection-group query over likes). */
export async function listLikedBuildIds(userId: string): Promise<string[]> {
  const snapshot = await getDocs(
    query(
      collectionGroup(firestore, 'likes'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snapshot.docs.flatMap((like) =>
    like.ref.parent.parent ? [like.ref.parent.parent.id] : [],
  );
}
