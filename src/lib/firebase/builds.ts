// builds/{id}: read, list, create, update, delete. Likes and comments live in ./likes and ./comments.
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentSnapshot,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { customAlphabet } from 'nanoid';
import { calculateLevel } from '@/lib/buildMath';
import { GAME_ELDEN_RING, type Build, type BuildContent, type BuildDoc } from '@/lib/models';
import { firestore } from './app';

/** Build ids are 12 characters of [0-9A-Z], short enough for nice URLs (/build/SEEDBLEED001). */
export const newBuildId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

/** What the editor saves. The level is always recomputed from the stats. */
export type BuildInput = Omit<BuildContent, 'level'>;

export type BuildSort = 'top' | 'new';

/** Where a page of builds ended (the last build's snapshot). */
export type BuildCursor = QueryDocumentSnapshot;

export interface BuildPage {
  builds: Build[];
  /** Pass back as `cursor` for the next page; null when there are no more. */
  nextCursor: BuildCursor | null;
}

const buildsCollection = () => collection(firestore, 'builds');
const buildRef = (id: string) => doc(firestore, 'builds', id);

export function toBuild(snapshot: DocumentSnapshot): Build {
  // Shape guaranteed by firestore.rules on every write; pending server timestamps read as estimates.
  const data = snapshot.data({ serverTimestamps: 'estimate' }) as BuildDoc;
  return {
    id: snapshot.id,
    ownerId: data.ownerId,
    game: data.game,
    name: data.name,
    description: data.description,
    tags: data.tags,
    level: data.level,
    stats: data.stats,
    startingClass: data.startingClass ?? null, // absent on builds saved before T8
    equipment: data.equipment,
    likeCount: data.likeCount,
    commentCount: data.commentCount,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

/** The owner-editable fields as stored: trimmed name, its lowercase copy, the computed level. */
export function contentFields(input: BuildInput) {
  const name = input.name.trim();
  return {
    name,
    nameLower: name.toLowerCase(),
    description: input.description,
    tags: input.tags,
    level: calculateLevel(input.stats),
    stats: input.stats,
    startingClass: input.startingClass,
    equipment: input.equipment,
  };
}

/** The build, or null if there is no build with that id. */
export async function getBuild(id: string): Promise<Build | null> {
  const snapshot = await getDoc(buildRef(id));
  return snapshot.exists() ? toBuild(snapshot) : null;
}

/** One page of Elden Ring builds, most liked or newest first, optionally with one tag. */
export async function listBuilds({
  sort = 'top',
  tag,
  pageSize = 24,
  cursor,
}: {
  sort?: BuildSort;
  tag?: string;
  pageSize?: number;
  cursor?: BuildCursor | null;
} = {}): Promise<BuildPage> {
  const constraints: QueryConstraint[] = [where('game', '==', GAME_ELDEN_RING)];
  if (tag) constraints.push(where('tags', 'array-contains', tag));
  constraints.push(orderBy(sort === 'top' ? 'likeCount' : 'createdAt', 'desc'));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize));
  const snapshot = await getDocs(query(buildsCollection(), ...constraints));
  return {
    builds: snapshot.docs.map(toBuild),
    nextCursor: snapshot.docs.length === pageSize ? (snapshot.docs.at(-1) ?? null) : null,
  };
}

/**
 * One page of Elden Ring builds whose name starts with `text` (case-insensitive), by name. Firestore
 * has no full-text search; a prefix query on `nameLower` is the free option.
 */
export async function searchBuilds(
  text: string,
  { pageSize = 24, cursor }: { pageSize?: number; cursor?: BuildCursor | null } = {},
): Promise<BuildPage> {
  const prefix = text.trim().toLowerCase();
  const constraints: QueryConstraint[] = [
    where('game', '==', GAME_ELDEN_RING),
    where('nameLower', '>=', prefix),
    where('nameLower', '<=', `${prefix}\uf8ff`),
    orderBy('nameLower'),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize));
  const snapshot = await getDocs(query(buildsCollection(), ...constraints));
  return {
    builds: snapshot.docs.map(toBuild),
    nextCursor: snapshot.docs.length === pageSize ? (snapshot.docs.at(-1) ?? null) : null,
  };
}

/** Every build a user owns, newest first. */
export async function listUserBuilds(userId: string): Promise<Build[]> {
  const snapshot = await getDocs(
    query(buildsCollection(), where('ownerId', '==', userId), orderBy('createdAt', 'desc')),
  );
  return snapshot.docs.map(toBuild);
}

/** Creates a build owned by `ownerId` and resolves to its new id. */
export async function createBuild(ownerId: string, input: BuildInput): Promise<string> {
  const id = newBuildId();
  await setDoc(buildRef(id), {
    ...contentFields(input),
    ownerId,
    game: GAME_ELDEN_RING,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

/** Saves the owner's edits. Likes, comments and the owner are never touched. */
export async function updateBuild(id: string, input: BuildInput): Promise<void> {
  await updateDoc(buildRef(id), { ...contentFields(input), updatedAt: serverTimestamp() });
}

// A batched write holds at most 500 operations.
const BATCH_LIMIT = 450;

/**
 * Deletes a build (owner or admin), then its likes and comments. The rules let anyone signed in
 * delete likes/comments of a build that no longer exists, so a cleanup cut short leaves only
 * unreachable orphans.
 */
export async function deleteBuild(id: string): Promise<void> {
  await deleteDoc(buildRef(id));
  for (const sub of ['likes', 'comments']) {
    const snapshot = await getDocs(collection(firestore, 'builds', id, sub));
    for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(firestore);
      snapshot.docs.slice(i, i + BATCH_LIMIT).forEach((child) => batch.delete(child.ref));
      await batch.commit();
    }
  }
}
