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
import { calculateLevel, MAX_LEVEL } from '@/lib/buildMath';
import { GAME_ELDEN_RING, type Build, type BuildContent, type BuildDoc } from '@/lib/models';
import { firestore } from './app';

/** Build ids are 12 characters of [0-9A-Z], short enough for nice URLs (/build/SEEDBLEED001). */
export const newBuildId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

/** What the editor saves. The level is always recomputed from the stats. */
export type BuildInput = Omit<BuildContent, 'level'>;

/** Most liked, newest, or most played (everyone tracking it, T36). */
export type BuildSort = 'top' | 'new' | 'played';

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
    image: data.image ?? null, // absent on builds saved before T40
    likeCount: data.likeCount,
    commentCount: data.commentCount,
    playerCount: data.playerCount ?? 0, // absent on builds saved before T36 (until backfilled)
    finishedCount: data.finishedCount ?? 0,
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
    image: input.image,
  };
}

/** The build, or null if there is no build with that id. */
export async function getBuild(id: string): Promise<Build | null> {
  const snapshot = await getDoc(buildRef(id));
  return snapshot.exists() ? toBuild(snapshot) : null;
}

/** A level range (inclusive) to filter builds by; omit an end for no limit on that side. */
export interface LevelRange {
  minLevel?: number;
  maxLevel?: number;
}

interface PageOptions extends LevelRange {
  /** Only builds with this tag. */
  tag?: string;
  pageSize?: number;
  cursor?: BuildCursor | null;
}

/**
 * The level range as Firestore range filters. They sit next to an `orderBy` on another field (likes,
 * date or name), which works with Firestore's multi-field range support and an index that ends in
 * `level` (equality fields, then the order field, then the range): see firestore.indexes.json.
 */
function levelConstraints({ minLevel, maxLevel }: LevelRange): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  if (minLevel !== undefined && minLevel > 1) constraints.push(where('level', '>=', minLevel));
  if (maxLevel !== undefined && maxLevel < MAX_LEVEL)
    constraints.push(where('level', '<=', maxLevel));
  return constraints;
}

async function fetchPage(
  constraints: QueryConstraint[],
  pageSize: number,
  cursor?: BuildCursor | null,
) {
  const all = [...constraints];
  if (cursor) all.push(startAfter(cursor));
  all.push(limit(pageSize));
  const snapshot = await getDocs(query(buildsCollection(), ...all));
  return {
    builds: snapshot.docs.map(toBuild),
    nextCursor: snapshot.docs.length === pageSize ? (snapshot.docs.at(-1) ?? null) : null,
  } satisfies BuildPage;
}

// "Most played" orders by playerCount, which builds from before T36 lack until the backfill
// (`scripts/admin.mjs counts --write`): Firestore leaves such builds out of that order.
const SORT_FIELDS = { top: 'likeCount', new: 'createdAt', played: 'playerCount' } as const;

/**
 * One page of Elden Ring builds, most liked, newest or most played first, optionally with one tag and a level
 * range (all in Firestore).
 */
export async function listBuilds({
  sort = 'top',
  tag,
  pageSize = 24,
  cursor,
  ...levels
}: PageOptions & { sort?: BuildSort } = {}): Promise<BuildPage> {
  const constraints: QueryConstraint[] = [where('game', '==', GAME_ELDEN_RING)];
  if (tag) constraints.push(where('tags', 'array-contains', tag));
  constraints.push(...levelConstraints(levels));
  constraints.push(orderBy(SORT_FIELDS[sort], 'desc'));
  return fetchPage(constraints, pageSize, cursor);
}

/**
 * One page of Elden Ring builds with the weapon `weaponId` in any hand, most liked first (T55's weapon
 * pages). `equipment.weapons` holds game IDs and nulls, so array-contains finds it in any of the six
 * slots: no extra field on builds (index: equipment.weapons, game, likeCount).
 */
export async function listBuildsByWeapon(
  weaponId: number,
  { pageSize = 24, cursor }: Pick<PageOptions, 'pageSize' | 'cursor'> = {},
): Promise<BuildPage> {
  return fetchPage(
    [
      where('game', '==', GAME_ELDEN_RING),
      where('equipment.weapons', 'array-contains', weaponId),
      orderBy('likeCount', 'desc'),
    ],
    pageSize,
    cursor,
  );
}

/**
 * One page of Elden Ring builds whose name starts with `text` (case-insensitive), by name, optionally
 * with one tag and a level range. Firestore has no full-text search; a prefix query on `nameLower` is
 * the free option.
 */
export async function searchBuilds(
  text: string,
  { tag, pageSize = 24, cursor, ...levels }: PageOptions = {},
): Promise<BuildPage> {
  const prefix = text.trim().toLowerCase();
  const constraints: QueryConstraint[] = [where('game', '==', GAME_ELDEN_RING)];
  if (tag) constraints.push(where('tags', 'array-contains', tag));
  constraints.push(
    where('nameLower', '>=', prefix),
    where('nameLower', '<=', `${prefix}\uf8ff`),
    ...levelConstraints(levels),
    orderBy('nameLower'),
  );
  return fetchPage(constraints, pageSize, cursor);
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
    playerCount: 0,
    finishedCount: 0,
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
