// scripts/seed-builds.mjs against the emulators (T52): seeded builds are created once, re-runs change nothing
// or update only the content (counters, likes and createdAt stay), and someone else's build is never touched.
// `npm run test:rules`.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { checkSeed } from '../../scripts/lib/seed-content.mjs';
import { LOCAL_OWNER, resolveOwner, seedBuilds } from '../../scripts/seed-builds.mjs';

const PROJECT_ID = 'demo-soulsbuilds-test';
let app: App;
let db: Firestore;
const backupDir = mkdtempSync(join(tmpdir(), 'soulsbuilds-seed-'));

beforeAll(() => {
  app = initializeApp({ projectId: PROJECT_ID }, 'seed-builds-test');
  db = getFirestore(app);
});
afterAll(() => deleteApp(app));

async function clear() {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  await fetch(`http://${host}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, {
    method: 'DELETE',
  });
}

beforeEach(clear);

const OWNER = 'souls-builds';

/** A checked seed (as the CLI passes them), from a minimal valid build. */
function checked(id: string, name = 'Moonveil Test') {
  const seed = {
    id,
    name,
    level: 45,
    startingClass: null,
    stats: { vigor: 20, mind: 15, end: 10, str: 12, dex: 18, int: 23, fai: 10, arc: 16 },
    rightHand: [{ weapon: 'Moonveil' }],
    tags: ['Intelligence', 'Katana'],
    source: {
      author: 'Someone',
      site: 'Example',
      title: 'Moon Knight',
      url: 'https://example.com/moon',
    },
  };
  const result = checkSeed({ file: id, seed, writeUp: 'Moonveil early.' });
  expect(result.errors).toEqual([]);
  return { file: id, seed, ...result };
}

describe('seedBuilds', () => {
  it('creates a build owned by the seed owner, with every counter at 0', async () => {
    const results = await seedBuilds(db, [checked('SEEDA')], {
      ownerId: OWNER,
      write: true,
      backupDir,
    });
    expect(results).toEqual([
      { id: 'SEEDA', file: 'SEEDA', action: 'create', changed: [], backup: null },
    ]);
    const build = (await db.doc('builds/SEEDA').get()).data();
    expect(build).toMatchObject({
      name: 'Moonveil Test',
      nameLower: 'moonveil test',
      ownerId: OWNER,
      game: 'elden-ring',
      level: 45,
      startingClass: null,
      image: null,
      likeCount: 0,
      commentCount: 0,
      playerCount: 0,
      finishedCount: 0,
    });
    expect(build?.description).toMatch(/^Moonveil early\.\n\n---\n\n_Loadout from Someone's/);
    expect(build?.createdAt).toBeInstanceOf(Timestamp);
  });

  it('writes nothing in a dry run', async () => {
    const results = await seedBuilds(db, [checked('SEEDA')], { ownerId: OWNER, backupDir });
    expect(results[0]?.action).toBe('create');
    expect((await db.doc('builds/SEEDA').get()).exists).toBe(false);
  });

  it('leaves an unchanged build alone, and updates only the content of a changed one', async () => {
    await seedBuilds(db, [checked('SEEDA')], { ownerId: OWNER, write: true, backupDir });
    const createdAt = (await db.doc('builds/SEEDA').get()).get('createdAt');
    await db.doc('builds/SEEDA').update({ likeCount: 3, commentCount: 1, playerCount: 2 });

    const again = await seedBuilds(db, [checked('SEEDA')], {
      ownerId: OWNER,
      write: true,
      backupDir,
    });
    expect(again[0]).toMatchObject({ action: 'unchanged', changed: [], backup: null });

    const renamed = await seedBuilds(db, [checked('SEEDA', 'Moonveil Renamed')], {
      ownerId: OWNER,
      write: true,
      backupDir,
    });
    expect(renamed[0]).toMatchObject({ action: 'update', changed: ['name', 'nameLower'] });
    const backup = JSON.parse(readFileSync(renamed[0]?.backup ?? '', 'utf8'));
    expect(backup['builds/SEEDA'].name).toBe('Moonveil Test');

    const build = (await db.doc('builds/SEEDA').get()).data();
    expect(build).toMatchObject({
      name: 'Moonveil Renamed',
      likeCount: 3,
      commentCount: 1,
      playerCount: 2,
    });
    expect(build?.createdAt).toEqual(createdAt);
  });

  it("refuses an ID that is someone else's build, and then writes nothing at all", async () => {
    await db.doc('builds/TAKEN').set({ name: 'Mine', ownerId: 'alice', game: 'elden-ring' });
    const results = await seedBuilds(db, [checked('SEEDA'), checked('TAKEN')], {
      ownerId: OWNER,
      write: true,
      backupDir,
    });
    expect(results.map(({ action }) => action)).toEqual(['create', 'refused']);
    expect((await db.doc('builds/SEEDA').get()).exists).toBe(false);
    expect((await db.doc('builds/TAKEN').get()).get('name')).toBe('Mine');
  });
});

describe('resolveOwner', () => {
  const auth = () => getAuth(app);

  it('on the emulator, creates the local Souls Builds account with a profile', async () => {
    await auth()
      .deleteUser(LOCAL_OWNER.uid)
      .catch(() => {});
    const dry = await resolveOwner(db, auth(), null, { emulator: true });
    expect(dry).toEqual({ uid: LOCAL_OWNER.uid, displayName: 'Souls Builds', created: true });
    expect((await db.doc(`users/${LOCAL_OWNER.uid}`).get()).exists).toBe(false);

    await resolveOwner(db, auth(), null, { emulator: true, write: true });
    expect((await db.doc(`users/${LOCAL_OWNER.uid}`).get()).get('displayName')).toBe(
      'Souls Builds',
    );
    expect((await auth().getUser(LOCAL_OWNER.uid)).email).toBe(LOCAL_OWNER.email);
  });

  it('needs an owner outside the emulator, and one with a profile', async () => {
    await expect(resolveOwner(db, auth(), null)).rejects.toThrow(/--owner/);
    await auth()
      .createUser({ uid: 'no-profile', email: 'noprofile@example.test' })
      .catch(() => {});
    await expect(resolveOwner(db, auth(), 'noprofile@example.test')).rejects.toThrow(
      /has no profile yet/,
    );
    await db
      .doc('users/no-profile')
      .set({ displayName: 'Souls Builds', createdAt: Timestamp.now() });
    expect(await resolveOwner(db, auth(), 'no-profile')).toEqual({
      uid: 'no-profile',
      displayName: 'Souls Builds',
      created: false,
    });
  });
});
