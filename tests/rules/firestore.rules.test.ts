// Security rules tests (firestore.rules), against the Firestore emulator: `npm run test:rules`.
// Each test starts from an empty database; `seed` writes with the rules disabled.
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-soulsbuilds-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

/** Firestore as a signed-in user (with optional custom claims), or signed out. */
const as = (uid?: string, claims: Record<string, unknown> = {}): Firestore =>
  (uid
    ? env.authenticatedContext(uid, claims)
    : env.unauthenticatedContext()
  ).firestore() as unknown as Firestore;

const seed = (write: (db: Firestore) => Promise<unknown>) =>
  env.withSecurityRulesDisabled(async (context) => {
    await write(context.firestore() as unknown as Firestore);
  });

const content = () => ({
  name: 'Bloodhound Samurai',
  nameLower: 'bloodhound samurai',
  description: 'A **bleed** build.',
  tags: ['Malenia', 'Mohg'],
  level: 131,
  stats: { vigor: 50, mind: 15, end: 25, str: 18, dex: 40, int: 9, fai: 8, arc: 45 },
  equipment: {
    weapons: ['Rivers of Blood', null, null, 'Uchigatana', null, null],
    weaponAffinities: [null, null, null, 'Blood', null, null],
    weaponSkills: [null, null, null, 'Seppuku', null, null],
    arrows: [null, null, null, null],
    talismans: ["Lord of Blood's Exultation"],
    spells: [],
    tears: ['Opaline Hardtear'],
    consumables: [],
    helm: 'White Mask',
    chest: null,
    gauntlet: null,
    leg: null,
  },
});

/** A build as the client creates it. */
const newBuild = (ownerId: string, overrides: Record<string, unknown> = {}) => ({
  ...content(),
  ownerId,
  game: 'elden-ring',
  likeCount: 0,
  commentCount: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

/** Alice's build B1, already in the database. */
const seedBuild = (overrides: Record<string, unknown> = {}) =>
  seed((db) =>
    setDoc(doc(db, 'builds/B1'), {
      ...newBuild('alice'),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...overrides,
    }),
  );

const like = (db: Firestore, uid: string, delta = 1, buildId = 'B1') => {
  const batch = writeBatch(db);
  batch.set(doc(db, `builds/${buildId}/likes/${uid}`), {
    userId: uid,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, `builds/${buildId}`), { likeCount: increment(delta) });
  return batch.commit();
};

const unlike = (db: Firestore, uid: string, delta = -1) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, `builds/B1/likes/${uid}`));
  batch.update(doc(db, 'builds/B1'), { likeCount: increment(delta) });
  return batch.commit();
};

const comment = (db: Firestore, id: string, data: Record<string, unknown>, delta = 1) => {
  const batch = writeBatch(db);
  batch.set(doc(db, `builds/B1/comments/${id}`), { createdAt: serverTimestamp(), ...data });
  batch.update(doc(db, 'builds/B1'), { commentCount: increment(delta), lastCommentId: id });
  return batch.commit();
};

const deleteComment = (db: Firestore, id: string) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, `builds/B1/comments/${id}`));
  batch.update(doc(db, 'builds/B1'), { commentCount: increment(-1), lastCommentId: id });
  return batch.commit();
};

describe('users/{uid}', () => {
  const profile = (displayName = 'Tarnished') => ({ displayName, createdAt: serverTimestamp() });

  it('anyone can read a profile', async () => {
    await seed((db) =>
      setDoc(doc(db, 'users/alice'), { displayName: 'A', createdAt: Timestamp.now() }),
    );
    await assertSucceeds(getDoc(doc(as(), 'users/alice')));
  });

  it('a user creates only their own profile', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users/alice'), profile()));
    await assertFails(setDoc(doc(as('bob'), 'users/carol'), profile()));
    await assertFails(setDoc(doc(as(), 'users/alice'), profile()));
  });

  it('a profile holds only displayName and a server createdAt (no admin flag, no email)', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'users/alice'), { ...profile(), admin: true }));
    await assertFails(setDoc(doc(db, 'users/alice'), { ...profile(), email: 'a@example.test' }));
    await assertFails(
      setDoc(doc(db, 'users/alice'), { displayName: 'A', createdAt: Timestamp.now() }),
    );
  });

  it('display names are trimmed, 1–40 characters', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'users/alice'), profile('')));
    await assertFails(setDoc(doc(db, 'users/alice'), profile(' padded ')));
    await assertFails(setDoc(doc(db, 'users/alice'), profile('x'.repeat(41))));
    await assertSucceeds(setDoc(doc(db, 'users/alice'), profile('x'.repeat(40))));
  });

  it('a user renames themselves, but changes nothing else and nobody else', async () => {
    await seed((db) =>
      setDoc(doc(db, 'users/alice'), { displayName: 'A', createdAt: Timestamp.now() }),
    );
    await assertSucceeds(updateDoc(doc(as('alice'), 'users/alice'), { displayName: 'Alice' }));
    await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { createdAt: Timestamp.now() }));
    await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { admin: true }));
    await assertFails(updateDoc(doc(as('bob'), 'users/alice'), { displayName: 'Bob' }));
    await assertFails(deleteDoc(doc(as('alice'), 'users/alice')));
  });
});

describe('builds/{id}: create', () => {
  it('anyone can read builds', async () => {
    await seedBuild();
    await assertSucceeds(getDoc(doc(as(), 'builds/B1')));
  });

  it('a signed-in user creates a build they own', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'builds/N1'), newBuild('alice')));
    await assertFails(setDoc(doc(as('alice'), 'builds/N2'), newBuild('bob')));
    await assertFails(setDoc(doc(as(), 'builds/N3'), newBuild('alice')));
  });

  it.each([
    ['a non-zero likeCount', { likeCount: 5 }],
    ['a non-zero commentCount', { commentCount: 1 }],
    ['another game', { game: 'dark-souls-3' }],
    ['a client createdAt', { createdAt: Timestamp.now() }],
    ['a client updatedAt', { updatedAt: Timestamp.now() }],
    ['an extra field', { admin: true }],
    ['a level that does not match the stats', { level: 150 }],
    ['an empty name', { name: '', nameLower: '' }],
    ['an untrimmed name', { name: 'Samurai ', nameLower: 'samurai ' }],
    ['a name over 80 characters', { name: 'x'.repeat(81), nameLower: 'x'.repeat(81) }],
    ['a nameLower that does not match', { nameLower: 'something else' }],
    ['a description over 20000 characters', { description: 'x'.repeat(20001) }],
    ['more than 20 tags', { tags: Array.from({ length: 21 }, (_, i) => `tag${i}`) }],
  ])('rejects a build with %s', async (_label, overrides) => {
    await assertFails(setDoc(doc(as('alice'), 'builds/N1'), newBuild('alice', overrides)));
  });

  it.each([
    ['a stat above 99', { vigor: 100 }],
    ['a stat below 1', { vigor: 0 }],
    ['a stat stored as text', { vigor: '50' }],
    ['a fractional stat', { vigor: 50.5 }],
  ])('rejects %s', async (_label, statOverrides) => {
    const stats = { ...content().stats, ...statOverrides };
    await assertFails(setDoc(doc(as('alice'), 'builds/N1'), newBuild('alice', { stats })));
  });

  it('rejects missing stats and malformed equipment', async () => {
    const { arc: _arc, ...sevenStats } = content().stats;
    const equipment = content().equipment;
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'builds/N1'), newBuild('alice', { stats: sevenStats })));
    await assertFails(
      setDoc(
        doc(db, 'builds/N1'),
        newBuild('alice', { equipment: { ...equipment, weapons: [null, null, null] } }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db, 'builds/N1'),
        newBuild('alice', { equipment: { ...equipment, talismans: ['a', 'b', 'c', 'd', 'e'] } }),
      ),
    );
    await assertFails(
      setDoc(doc(db, 'builds/N1'), newBuild('alice', { equipment: { ...equipment, extra: 1 } })),
    );
  });

  it('computes level 1 for stats summing below 80', async () => {
    const stats = { vigor: 1, mind: 1, end: 1, str: 1, dex: 1, int: 1, fai: 1, arc: 1 };
    await assertSucceeds(
      setDoc(doc(as('alice'), 'builds/N1'), newBuild('alice', { stats, level: 1 })),
    );
  });
});

describe('builds/{id}: update and delete', () => {
  beforeEach(() => seedBuild());

  const edit = (overrides: Record<string, unknown> = {}) => ({
    name: 'Bleed Samurai',
    nameLower: 'bleed samurai',
    updatedAt: serverTimestamp(),
    ...overrides,
  });

  it('the owner edits the content and bumps updatedAt', async () => {
    await assertSucceeds(updateDoc(doc(as('alice'), 'builds/B1'), edit()));
    const { updatedAt: _updatedAt, ...withoutBump } = edit();
    await assertFails(updateDoc(doc(as('alice'), 'builds/B1'), withoutBump));
  });

  it('the owner cannot change the owner, game, counts or createdAt', async () => {
    const db = as('alice');
    await assertFails(updateDoc(doc(db, 'builds/B1'), edit({ ownerId: 'bob' })));
    await assertFails(updateDoc(doc(db, 'builds/B1'), edit({ game: 'sekiro' })));
    await assertFails(updateDoc(doc(db, 'builds/B1'), edit({ likeCount: 100 })));
    await assertFails(updateDoc(doc(db, 'builds/B1'), edit({ commentCount: 3 })));
    await assertFails(updateDoc(doc(db, 'builds/B1'), edit({ createdAt: serverTimestamp() })));
  });

  it('edits are validated like a new build', async () => {
    const db = as('alice');
    await assertFails(updateDoc(doc(db, 'builds/B1'), edit({ level: 5 })));
    await assertFails(updateDoc(doc(db, 'builds/B1'), edit({ nameLower: 'nope' })));
    await assertFails(updateDoc(doc(db, 'builds/B1'), edit({ 'stats.vigor': 120 })));
  });

  it('nobody else edits the build', async () => {
    await assertFails(updateDoc(doc(as('bob'), 'builds/B1'), edit()));
    await assertFails(updateDoc(doc(as(), 'builds/B1'), edit()));
  });

  it('the owner or an admin deletes the build; nobody else', async () => {
    await assertFails(deleteDoc(doc(as('bob'), 'builds/B1')));
    await assertSucceeds(deleteDoc(doc(as('root', { admin: true }), 'builds/B1')));
    await seedBuild();
    await assertSucceeds(deleteDoc(doc(as('alice'), 'builds/B1')));
  });

  it('a client-set admin field grants nothing', async () => {
    await assertFails(deleteDoc(doc(as('bob', { admin: false }), 'builds/B1')));
  });
});

describe('builds/{id}/likes/{uid}', () => {
  beforeEach(() => seedBuild());

  it('a signed-in user likes a build together with the counter', async () => {
    await assertSucceeds(like(as('bob'), 'bob'));
    const snapshot = await getDoc(doc(as(), 'builds/B1'));
    if (snapshot.data()?.likeCount !== 1) throw new Error('likeCount should be 1');
  });

  it('one like per user', async () => {
    await assertSucceeds(like(as('bob'), 'bob'));
    await assertFails(like(as('bob'), 'bob'));
  });

  it('the like doc and the counter must change together, by exactly 1', async () => {
    const db = as('bob');
    await assertFails(
      setDoc(doc(db, 'builds/B1/likes/bob'), { userId: 'bob', createdAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(doc(db, 'builds/B1'), { likeCount: increment(1) }));
    await assertFails(like(db, 'bob', 2));
  });

  it('nobody likes on behalf of someone else, or while signed out', async () => {
    await assertFails(like(as('bob'), 'carol'));
    await assertFails(like(as(), 'bob'));
  });

  it('a like holds only userId and a server createdAt', async () => {
    const db = as('bob');
    const batch = writeBatch(db);
    batch.set(doc(db, 'builds/B1/likes/bob'), {
      userId: 'bob',
      createdAt: serverTimestamp(),
      weight: 10,
    });
    batch.update(doc(db, 'builds/B1'), { likeCount: increment(1) });
    await assertFails(batch.commit());
  });

  it('a user removes their own like together with the counter', async () => {
    await like(as('bob'), 'bob');
    await assertFails(deleteDoc(doc(as('bob'), 'builds/B1/likes/bob')));
    await assertFails(updateDoc(doc(as('bob'), 'builds/B1'), { likeCount: increment(-1) }));
    await assertFails(unlike(as('carol'), 'bob'));
    await assertSucceeds(unlike(as('bob'), 'bob'));
  });

  it('cannot unlike what was never liked', async () => {
    await seedBuild({ likeCount: 3 });
    await assertFails(unlike(as('bob'), 'bob'));
  });

  it('anyone can list who liked a build, and what a user liked', async () => {
    await like(as('bob'), 'bob');
    await assertSucceeds(
      getDocs(query(collectionGroup(as(), 'likes'), where('userId', '==', 'bob'))),
    );
  });
});

describe('builds/{id}/comments/{id}', () => {
  beforeEach(() => seedBuild());

  it('a signed-in user comments together with the counter', async () => {
    await assertSucceeds(comment(as('bob'), 'c1', { authorId: 'bob', text: 'Nice build!' }));
  });

  it('the comment and the counter must change together', async () => {
    const db = as('bob');
    await assertFails(
      setDoc(doc(db, 'builds/B1/comments/c1'), {
        authorId: 'bob',
        text: 'hi',
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'builds/B1'), { commentCount: increment(1), lastCommentId: 'c9' }),
    );
    await assertFails(comment(db, 'c1', { authorId: 'bob', text: 'hi' }, 2));
  });

  it('comments are by the signed-in author, trimmed, 1–1000 characters', async () => {
    await assertFails(comment(as('bob'), 'c1', { authorId: 'alice', text: 'fake' }));
    await assertFails(comment(as(), 'c1', { authorId: 'bob', text: 'hi' }));
    await assertFails(comment(as('bob'), 'c1', { authorId: 'bob', text: '' }));
    await assertFails(comment(as('bob'), 'c1', { authorId: 'bob', text: ' hi ' }));
    await assertFails(comment(as('bob'), 'c1', { authorId: 'bob', text: 'x'.repeat(1001) }));
    await assertFails(comment(as('bob'), 'c1', { authorId: 'bob', text: 'hi', pinned: true }));
  });

  it('the author (or an admin) deletes a comment together with the counter; nobody edits', async () => {
    await comment(as('bob'), 'c1', { authorId: 'bob', text: 'first' });
    await comment(as('bob'), 'c2', { authorId: 'bob', text: 'second' });
    await assertFails(updateDoc(doc(as('bob'), 'builds/B1/comments/c1'), { text: 'edited' }));
    await assertFails(deleteDoc(doc(as('bob'), 'builds/B1/comments/c1')));
    await assertFails(deleteComment(as('carol'), 'c1'));
    await assertFails(deleteComment(as('alice'), 'c1'));
    await assertSucceeds(deleteComment(as('bob'), 'c1'));
    await assertSucceeds(deleteComment(as('root', { admin: true }), 'c2'));
  });
});

describe('after a build is deleted', () => {
  it('any signed-in user may clean up its likes and comments', async () => {
    await seedBuild();
    await like(as('bob'), 'bob');
    await comment(as('bob'), 'c1', { authorId: 'bob', text: 'hi' });
    await assertFails(deleteDoc(doc(as('alice'), 'builds/B1/likes/bob')));
    await deleteDoc(doc(as('alice'), 'builds/B1'));
    await assertFails(deleteDoc(doc(as(), 'builds/B1/likes/bob')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'builds/B1/likes/bob')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'builds/B1/comments/c1')));
  });

  it('nobody can like or comment on it', async () => {
    await assertFails(like(as('bob'), 'bob', 1, 'GONE'));
  });
});

describe('everything else', () => {
  it('is denied', async () => {
    await assertFails(setDoc(doc(as('alice'), 'reports/r1'), { reason: 'spam' }));
    await assertFails(getDoc(doc(as('alice'), 'secrets/x')));
  });
});
