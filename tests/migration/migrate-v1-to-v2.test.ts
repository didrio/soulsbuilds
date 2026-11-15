// scripts/migrate-v1-to-v2.mjs against v1 data in the emulator, then the v2 rules against the result
// (migrated docs must be ones their owners can keep editing). Items go from 2022 names to game IDs
// (scripts/lib/names-to-ids.mjs). `npm run test:rules`.
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
    tags: ['Rennala', 'Warhammer', 'Great Hammer'],
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
    weaponAffinities: ['Heavy'],
    weaponSkills: [],
    arrows: [null, null, null, null],
    tals: ['Not A Talisman', "Erdtree's Favor", "Erdtree's Favor +1", "Crepu's Vial"],
    spells: ["Rennala's Full Moon"],
    tears: [],
    cons: [],
    helm: "Brave's Cord Circlet",
    chest: "Lusat's Robe",
    gauntlet: null,
    leg: null,
  });
  // Any skill and affinity on any weapon, as the 2022 app allowed.
  await db.doc('builds/V1BLEED').set({
    user: 'alice',
    name: 'Bleed',
    level: '1',
    weapons: ['Uchigatana', 'Claymore', null, 'Brass Shield', 'Moonveil'],
    weaponAffinities: ['Blood', 'Frost', 'Heavy', 'Standard', null, null],
    weaponSkills: ['Seppuku', "Lion's Claw", null, 'Corpse Piler', 'Seppuku', null],
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
      builds: { total: 3, migrated: 3, alreadyV2: 0 },
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
    expect(report.dropped).toEqual({
      'talismans: Not A Talisman': 1,
      "armor: Brave's Cord Circlet": 1,
    });

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
    expect(moon?.tags).toEqual(['Rennala', 'Great Hammer']);
    expect(moon?.equipment).toEqual({
      weapons: [9060000, null, null, 33090000, null, null], // Moonveil, Carian Regal Scepter
      weaponAffinities: [null, null, null, null, null, null],
      weaponSkills: [null, null, null, null, null, null],
      arrows: [null, null, null, null],
      talismans: [1040, 6000], // Erdtree's Favor, Crepus's Vial (2022 typo "Crepu's")
      spells: [4360], // Rennala's Full Moon
      tears: [],
      consumables: [],
      helm: null,
      chest: 580100, // Lusat's Robe
      gauntlet: null,
      leg: null,
      greatRune: null,
      spiritAsh: null,
    });
    expect(report.notes).toEqual(
      expect.arrayContaining([
        'build V1MOON: tag "Warhammer" → "Great Hammer"',
        "build V1MOON: dropped Heavy affinity on Moonveil (the game doesn't allow it)",
        'build V1MOON: dropped talisman "Not A Talisman" (not in the game data)',
        "build V1MOON: dropped talisman \"Erdtree's Favor +1\" (can't be worn with Erdtree's Favor)",
        'build V1MOON: dropped helm "Brave\'s Cord Circlet" (not in the game data)',
      ]),
    );

    const bleed = (await db.doc('builds/V1BLEED').get()).data();
    expect(bleed?.equipment).toMatchObject({
      // Uchigatana, Claymore, -, Brass Shield, Moonveil
      weapons: [9000000, 3180000, null, 31130000, 9060000, null],
      // Lion's Claw is the Claymore's own skill (null); Frost is Cold; Standard is null.
      weaponSkills: [60600, null, null, null, null, null],
      weaponAffinities: ['blood', 'cold', null, null, null, null],
    });
    expect(report.notes).toEqual(
      expect.arrayContaining([
        'build V1BLEED: dropped Heavy affinity on empty weapon slot 3',
        'build V1BLEED: dropped skill "Corpse Piler" on Brass Shield (it keeps No Skill)',
        'build V1BLEED: dropped Ash of War "Seppuku" on Moonveil (the game doesn\'t allow it)',
      ]),
    );

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
      builds: { migrated: 0, alreadyV2: 3 },
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
