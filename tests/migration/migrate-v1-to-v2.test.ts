// scripts/migrate-v1-to-v2.mjs against v1 data in the emulator, then the v2 rules against the result
// (migrated docs must be ones their owners can keep editing). `npm run test:rules`.
import { readFileSync } from 'node:fs';
import {
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import {
  doc,
  increment,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../scripts/migrate-v1-to-v2.mjs';

const PROJECT_ID = 'demo-soulsbuilds-test';
let env: RulesTestEnvironment;
let app: App;
let db: AdminFirestore;

const MAY_2022 = Date.UTC(2022, 4, 1);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
  await env.clearFirestore();
  app = initializeApp({ projectId: PROJECT_ID }, 'migration-test');
  db = getFirestore(app);

  // v1 data as the 2022 app wrote it, including its oddities.
  await db.doc('users/alice').set({
    admin: true,
    email: 'alice@example.test',
    name: 'Alice',
    builds: ['V1MOON'],
    likedBuilds: [],
  });
  await db.doc('users/bob').set({
    admin: false,
    email: 'bob@example.test',
    name: '   ',
    builds: [],
    likedBuilds: ['V1MOON', 'MISSING'],
  });
  await db.doc('builds/V1MOON').set({
    user: 'alice',
    name: 'Carian Moon Knight',
    description: 'Moonveil.',
    tags: ['Rennala'],
    level: '132',
    likes: 3,
    comments: [
      { user: 'bob', comment: 'Nice build!', date: MAY_2022 },
      { user: 'bob', comment: '', date: MAY_2022 + 1 },
    ],
    vigor: '40',
    mind: 30,
    end: 15,
    str: 12,
    dex: 18,
    int: 'abc',
    fai: 7,
    arc: 9,
    weapons: ['Moonveil', null, null, 'Carian Regal Scepter'],
    weaponAffinities: [],
    weaponSkills: [],
    arrows: [null, null, null, null],
    tals: ['A', 'B', 'C', 'D', 'E'],
    spells: ["Rennala's Full Moon"],
    tears: [],
    cons: [],
    helm: null,
    chest: "Lusat's Robe",
    gauntlet: null,
    leg: null,
  });
  await db.doc('builds/V1EMPTY').set({ user: 'bob', name: '', level: '1' });
});

afterAll(async () => {
  await env.cleanup();
  await deleteApp(app);
});

describe('migrate v1 → v2', () => {
  it('a dry run reports and writes nothing', async () => {
    const report = await migrate(db);
    expect(report).toMatchObject({
      write: false,
      builds: { total: 2, migrated: 2, alreadyV2: 0 },
      users: { total: 2, migrated: 2, alreadyV2: 0 },
      likes: 1,
      comments: 1,
    });
    expect((await db.doc('builds/V1MOON').get()).data()?.user).toBe('alice');
  });

  it('writes v2 builds, likes, comments and profiles', async () => {
    const report = await migrate(db, { write: true });
    expect(report.notes).toEqual(
      expect.arrayContaining([
        'user bob: dropped like of missing build MISSING',
        "build V1MOON: likeCount 3 → 1 (counted from users' likes)",
        'build V1MOON: dropped 1 empty/invalid comment(s)',
        'user alice: was admin in v1; set the custom claim if still wanted',
      ]),
    );

    const moon = (await db.doc('builds/V1MOON').get()).data();
    expect(moon).toMatchObject({
      ownerId: 'alice',
      game: 'elden-ring',
      name: 'Carian Moon Knight',
      nameLower: 'carian moon knight',
      stats: { vigor: 40, mind: 30, end: 15, str: 12, dex: 18, int: 10, fai: 7, arc: 9 },
      level: 62,
      likeCount: 1,
      commentCount: 1,
      lastCommentId: 'v1-0',
    });
    expect(moon?.user).toBeUndefined();
    expect(moon?.comments).toBeUndefined();
    expect(moon?.equipment.weapons).toEqual([
      'Moonveil',
      null,
      null,
      'Carian Regal Scepter',
      null,
      null,
    ]);
    expect(moon?.equipment.talismans).toEqual(['A', 'B', 'C', 'D']);
    expect(moon?.equipment.chest).toBe("Lusat's Robe");

    const comment = (await db.doc('builds/V1MOON/comments/v1-0').get()).data();
    expect(comment?.text).toBe('Nice build!');
    expect(comment?.createdAt.toMillis()).toBe(MAY_2022);
    expect((await db.doc('builds/V1MOON/likes/bob').get()).data()?.userId).toBe('bob');
    expect((await db.doc('builds/V1EMPTY').get()).data()?.name).toBe('Untitled build');

    const alice = (await db.doc('users/alice').get()).data();
    expect(Object.keys(alice ?? {}).sort()).toEqual(['createdAt', 'displayName']);
    expect(alice?.displayName).toBe('Alice');
    expect((await db.doc('users/bob').get()).data()?.displayName).toBe('Tarnished');
  });

  it('is idempotent', async () => {
    const report = await migrate(db, { write: true });
    expect(report).toMatchObject({
      builds: { migrated: 0, alreadyV2: 2 },
      users: { migrated: 0, alreadyV2: 2 },
    });
    expect((await db.doc('builds/V1MOON').get()).data()?.likeCount).toBe(1);
  });

  it('migrated data works under the v2 rules', async () => {
    const as = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;
    const alice = as('alice');
    await assertSucceeds(
      updateDoc(doc(alice, 'builds/V1MOON'), {
        name: 'Moon Knight',
        nameLower: 'moon knight',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(updateDoc(doc(as('bob'), 'users/bob'), { displayName: 'Bob' }));

    const bob = as('bob');
    const unlike = writeBatch(bob);
    unlike.delete(doc(bob, 'builds/V1MOON/likes/bob'));
    unlike.update(doc(bob, 'builds/V1MOON'), { likeCount: increment(-1) });
    await assertSucceeds(unlike.commit());

    const uncomment = writeBatch(bob);
    uncomment.delete(doc(bob, 'builds/V1MOON/comments/v1-0'));
    uncomment.update(doc(bob, 'builds/V1MOON'), {
      commentCount: increment(-1),
      lastCommentId: 'v1-0',
    });
    await assertSucceeds(uncomment.commit());
  });
});
