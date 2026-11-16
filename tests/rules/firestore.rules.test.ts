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
  collection,
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
  startingClass: 3007, // Samurai
  equipment: {
    weapons: [9040000, null, null, 9000000, null, null], // Rivers of Blood, Uchigatana
    weaponAffinities: [null, null, null, 'blood', null, null],
    weaponSkills: [null, null, null, 60600, null, null], // Ash of War: Seppuku
    arrows: [null, null, null, null],
    talismans: [2160], // Lord of Blood's Exultation
    spells: [],
    tears: [11011], // Opaline Hardtear
    consumables: [],
    helm: 680000, // White Mask
    chest: null,
    gauntlet: null,
    leg: null,
    greatRune: 191, // Godrick's Great Rune
    spiritAsh: null,
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
  });

  it('a user deletes only their own profile (account deletion)', async () => {
    await seed((db) =>
      setDoc(doc(db, 'users/alice'), { displayName: 'A', createdAt: Timestamp.now() }),
    );
    await assertFails(deleteDoc(doc(as('bob'), 'users/alice')));
    await assertFails(deleteDoc(doc(as(), 'users/alice')));
    await assertFails(deleteDoc(doc(as('root', { admin: true }), 'users/alice')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'users/alice')));
    // Re-running a half-done account deletion: the profile is already gone.
    await assertSucceeds(deleteDoc(doc(as('alice'), 'users/alice')));
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
        newBuild('alice', { equipment: { ...equipment, talismans: [1, 2, 3, 4, 5] } }),
      ),
    );
    await assertFails(
      setDoc(doc(db, 'builds/N1'), newBuild('alice', { equipment: { ...equipment, extra: 1 } })),
    );
    const { greatRune: _greatRune, ...noGreatRune } = equipment;
    await assertFails(setDoc(doc(db, 'builds/N1'), newBuild('alice', { equipment: noGreatRune })));
  });

  // Items are game IDs. Positional lists and single slots are type-checked; the other lists only
  // by size (the rules' expression budget, see validEquipment).
  it.each([
    ['an item name instead of an ID', { helm: 'White Mask' }],
    ['a fractional ID', { greatRune: 191.5 }],
    ['a weapon name', { weapons: ['Uchigatana', null, null, null, null, null] }],
    ['an Ash of War name', { weaponSkills: ['Seppuku', null, null, null, null, null] }],
    ['an ID as text in an arrow slot', { arrows: ['50000000', null, null, null] }],
    ['the 2022 affinity name', { weaponAffinities: ['Blood', null, null, null, null, null] }],
    [
      'Standard as a key (stored as null)',
      { weaponAffinities: ['standard', null, null, null, null, null] },
    ],
    ['an unknown affinity', { weaponAffinities: [null, null, null, null, null, 'frost'] }],
  ])('rejects equipment with %s', async (_label, equipmentOverrides) => {
    const equipment = { ...content().equipment, ...equipmentOverrides };
    await assertFails(setDoc(doc(as('alice'), 'builds/N1'), newBuild('alice', { equipment })));
  });

  // Worst case for the rules' expression budget (see validEquipment): every slot filled.
  it('accepts a build with every slot filled and every stored affinity key', async () => {
    const equipment = {
      weapons: [9040000, 9000000, 9060000, 1000000, 2000000, 3000000],
      weaponAffinities: ['heavy', 'flame-art', 'cold', 'occult', 'blood', 'keen'],
      weaponSkills: [60600, 10000, 10100, 10200, 10300, 10400],
      arrows: [50000000, 50010000, 52000000, 52010000],
      talismans: [1000, 1010, 1020, 1030],
      spells: [4000, 4010, 4020, 4030, 4040, 4050, 4060, 4070, 4080, 4090, 4100, 4110],
      tears: [11011, 11000],
      consumables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      helm: 680000,
      chest: 580100,
      gauntlet: 580200,
      leg: 580300,
      greatRune: 191,
      spiritAsh: 207000,
    };
    const db = as('alice');
    await assertSucceeds(setDoc(doc(db, 'builds/N1'), newBuild('alice', { equipment })));
    await assertSucceeds(
      updateDoc(doc(db, 'builds/N1'), {
        equipment,
        name: 'Renamed',
        nameLower: 'renamed',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // T8: a CharaInitParam ID (3000 Vagabond … 3009 Wretch) or null; required on new builds.
  it.each([
    ['no starting class (null)', null],
    ['Vagabond', 3000],
    ['Wretch', 3009],
  ])('accepts %s', async (_label, startingClass) => {
    await assertSucceeds(
      setDoc(doc(as('alice'), 'builds/N1'), newBuild('alice', { startingClass })),
    );
  });

  it.each([
    ['an ID past the classes', 3010],
    ['an ID before them', 2999],
    ['the ID as text', '3007'],
    ['a class name', 'Samurai'],
  ])('rejects a starting class that is %s', async (_label, startingClass) => {
    await assertFails(setDoc(doc(as('alice'), 'builds/N1'), newBuild('alice', { startingClass })));
  });

  it('requires the starting class field on a new build', async () => {
    const { startingClass: _startingClass, ...withoutClass } = newBuild('alice');
    await assertFails(setDoc(doc(as('alice'), 'builds/N1'), withoutClass));
  });

  it('accepts 12 spells (Moon of Nokstella), not 13', async () => {
    const spells = Array.from({ length: 13 }, (_, i) => 4000 + i * 10);
    const equipment = (count: number) => ({
      ...content().equipment,
      spells: spells.slice(0, count),
    });
    const db = as('alice');
    await assertSucceeds(
      setDoc(doc(db, 'builds/N1'), newBuild('alice', { equipment: equipment(12) })),
    );
    await assertFails(
      setDoc(doc(db, 'builds/N2'), newBuild('alice', { equipment: equipment(13) })),
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

  it('a build from before T8 (no starting class) can be edited, and gain one', async () => {
    await seed(async (db) => {
      const { startingClass: _startingClass, ...old } = newBuild('alice');
      await setDoc(doc(db, 'builds/B1'), {
        ...old,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
    const db = as('alice');
    await assertSucceeds(updateDoc(doc(db, 'builds/B1'), edit()));
    await assertFails(updateDoc(doc(db, 'builds/B1'), edit({ startingClass: 42 })));
    await assertSucceeds(updateDoc(doc(db, 'builds/B1'), edit({ startingClass: 3001 })));
    await assertSucceeds(updateDoc(doc(db, 'builds/B1'), edit({ startingClass: null })));
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

  it('a user removes their likes on several builds, one batch each (account deletion)', async () => {
    await seedBuild();
    await seed((db) =>
      setDoc(doc(db, 'builds/B2'), {
        ...newBuild('carol'),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
    );
    await like(as('bob'), 'bob');
    await like(as('bob'), 'bob', 1, 'B2');
    for (const buildId of ['B1', 'B2']) {
      const db = as('bob');
      const batch = writeBatch(db);
      batch.delete(doc(db, `builds/${buildId}/likes/bob`));
      batch.update(doc(db, `builds/${buildId}`), { likeCount: increment(-1) });
      await assertSucceeds(batch.commit());
    }
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

describe('comments across builds', () => {
  it('anyone can list a user’s comments on every build (account deletion)', async () => {
    await seedBuild();
    await comment(as('bob'), 'c1', { authorId: 'bob', text: 'Nice' });
    await assertSucceeds(
      getDocs(query(collectionGroup(as(), 'comments'), where('authorId', '==', 'bob'))),
    );
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

describe('reports/{id}', () => {
  beforeEach(async () => {
    await seedBuild();
    await comment(as('bob'), 'c1', { authorId: 'bob', text: 'buy gold at example.test' });
  });

  /** A report as the client writes it. */
  const report = (reporterId: string, overrides: Record<string, unknown> = {}) => ({
    reporterId,
    buildId: 'B1',
    commentId: null,
    reason: 'spam',
    note: '',
    status: 'open',
    createdAt: serverTimestamp(),
    ...overrides,
  });

  it('a signed-in user reports a build or a comment, once', async () => {
    await assertSucceeds(setDoc(doc(as('carol'), 'reports/B1_carol'), report('carol')));
    await assertSucceeds(
      setDoc(doc(as('carol'), 'reports/c1_carol'), report('carol', { commentId: 'c1' })),
    );
    await assertFails(setDoc(doc(as('carol'), 'reports/B1_carol'), report('carol')));
    await assertFails(setDoc(doc(as(), 'reports/B1_anon'), report('anon')));
  });

  it('the doc id names the target and the reporter', async () => {
    await assertFails(setDoc(doc(as('carol'), 'reports/B1_dave'), report('dave')));
    await assertFails(setDoc(doc(as('carol'), 'reports/B1_dave'), report('carol')));
    await assertFails(setDoc(doc(as('carol'), 'reports/x_carol'), report('carol')));
    await assertFails(
      setDoc(doc(as('carol'), 'reports/B1_carol'), report('carol', { commentId: 'c1' })),
    );
  });

  it('the target must exist', async () => {
    await assertFails(
      setDoc(doc(as('carol'), 'reports/GONE_carol'), report('carol', { buildId: 'GONE' })),
    );
    await assertFails(
      setDoc(doc(as('carol'), 'reports/c9_carol'), report('carol', { commentId: 'c9' })),
    );
  });

  it('reason from the list, a trimmed note up to 500, status open, server time', async () => {
    const db = as('carol');
    const ref = doc(db, 'reports/B1_carol');
    await assertFails(setDoc(ref, report('carol', { reason: 'boring' })));
    await assertFails(setDoc(ref, report('carol', { note: 'x'.repeat(501) })));
    await assertFails(setDoc(ref, report('carol', { note: ' padded ' })));
    await assertFails(setDoc(ref, report('carol', { status: 'dismissed' })));
    await assertFails(setDoc(ref, report('carol', { createdAt: Timestamp.now() })));
    await assertFails(setDoc(ref, report('carol', { priority: 'high' })));
    await assertSucceeds(setDoc(ref, report('carol', { reason: 'other', note: 'x'.repeat(500) })));
  });

  it('admins list every report; a reporter reads and lists only their own; nobody edits them', async () => {
    await setDoc(doc(as('carol'), 'reports/B1_carol'), report('carol'));
    await assertSucceeds(getDoc(doc(as('carol'), 'reports/B1_carol')));
    await assertFails(getDoc(doc(as('alice'), 'reports/B1_carol')));
    await assertFails(getDocs(collection(as('carol'), 'reports')));
    const byReporter = (db: Firestore, uid: string) =>
      getDocs(query(collection(db, 'reports'), where('reporterId', '==', uid)));
    await assertSucceeds(byReporter(as('carol'), 'carol'));
    await assertFails(byReporter(as('alice'), 'carol'));
    await assertFails(byReporter(as(), 'carol'));
    await assertSucceeds(getDocs(collection(as('root', { admin: true }), 'reports')));
    await assertSucceeds(getDoc(doc(as('root', { admin: true }), 'reports/B1_carol')));
    await assertFails(updateDoc(doc(as('carol'), 'reports/B1_carol'), { note: 'changed' }));
    await assertFails(
      updateDoc(doc(as('root', { admin: true }), 'reports/B1_carol'), { status: 'dismissed' }),
    );
  });

  it('a reporter deletes their own reports (account deletion); nobody else does', async () => {
    await setDoc(doc(as('carol'), 'reports/B1_carol'), report('carol'));
    await assertFails(deleteDoc(doc(as('alice'), 'reports/B1_carol')));
    await assertFails(deleteDoc(doc(as(), 'reports/B1_carol')));
    await assertFails(deleteDoc(doc(as('root', { admin: true }), 'reports/B1_carol')));
    await assertSucceeds(deleteDoc(doc(as('carol'), 'reports/B1_carol')));
  });
});

describe('stats/{game}', () => {
  const stats = { buildCount: 1, authorCount: 1, userCount: 2, tagCounts: { Malenia: 1 } };

  it('anyone reads the community stats', async () => {
    await seed((db) => setDoc(doc(db, 'stats/elden-ring'), stats));
    await assertSucceeds(getDoc(doc(as(), 'stats/elden-ring')));
    await assertSucceeds(getDoc(doc(as('alice'), 'stats/elden-ring')));
  });

  it('no client writes them, admins included (the daily job uses the Admin SDK)', async () => {
    await seed((db) => setDoc(doc(db, 'stats/elden-ring'), stats));
    const inflated = { ...stats, buildCount: 9000 };
    await assertFails(setDoc(doc(as(), 'stats/elden-ring'), inflated));
    await assertFails(setDoc(doc(as('alice'), 'stats/elden-ring'), inflated));
    await assertFails(updateDoc(doc(as('alice'), 'stats/elden-ring'), { buildCount: 9000 }));
    await assertFails(setDoc(doc(as('alice'), 'stats/other-game'), stats));
    await assertFails(deleteDoc(doc(as('alice'), 'stats/elden-ring')));
    await assertFails(setDoc(doc(as('root', { admin: true }), 'stats/elden-ring'), inflated));
  });
});

describe('everything else', () => {
  it('is denied', async () => {
    await assertFails(setDoc(doc(as('alice'), 'secrets/x'), { reason: 'spam' }));
    await assertFails(getDoc(doc(as('alice'), 'secrets/x')));
  });
});
