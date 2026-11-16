// scripts/admin.mjs against the emulators: reports listing, remove (with backups and counters),
// dismiss, the admin claim, rename, delete-user and export. `npm run test:rules`.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  computeStats,
  deleteUserData,
  dismissReports,
  exportAll,
  listOpenReports,
  recountTracking,
  removeContent,
  renameUser,
  setAdmin,
  updateStats,
} from '../../scripts/admin.mjs';

const PROJECT_ID = 'demo-soulsbuilds-test';
let app: App;
let db: Firestore;
const backupDir = mkdtempSync(join(tmpdir(), 'soulsbuilds-admin-'));

beforeAll(() => {
  app = initializeApp({ projectId: PROJECT_ID }, 'admin-test');
  db = getFirestore(app);
});
afterAll(() => deleteApp(app));

const at = (day: number) => Timestamp.fromMillis(Date.UTC(2026, 10, day));

const report = (reporterId: string, buildId: string, commentId: string | null, day: number) =>
  db.doc(`reports/${commentId ?? buildId}_${reporterId}`).set({
    reporterId,
    buildId,
    commentId,
    reason: 'spam',
    note: day === 1 ? 'ads' : '',
    status: 'open',
    createdAt: at(day),
  });

beforeEach(async () => {
  await db.recursiveDelete(db.collection('builds'));
  await db.recursiveDelete(db.collection('reports'));
  await db.doc('builds/B1').set({ ownerId: 'alice', name: 'Spam build', commentCount: 2 });
  await db.doc('builds/B1/comments/c1').set({ authorId: 'bob', text: 'buy gold' });
  await db.doc('builds/B1/comments/c2').set({ authorId: 'carol', text: 'nice' });
  await db.doc('builds/B1/likes/bob').set({ userId: 'bob', createdAt: at(1) });
  await db.doc('builds/B2').set({ ownerId: 'dave', name: 'Fine build', commentCount: 0 });
  await report('carol', 'B1', null, 2);
  await report('dave', 'B1', null, 1);
  await report('dave', 'B1', 'c1', 3);
});

const status = async (id: string) => (await db.doc(`reports/${id}`).get()).get('status');

describe('admin script', () => {
  it('lists open reports grouped by target, oldest first, with the content', async () => {
    await db.doc('reports/B1_carol').update({ status: 'dismissed' });
    const groups = await listOpenReports(db);
    expect(groups.map((g) => [g.buildId, g.commentId, g.reports.length])).toEqual([
      ['B1', null, 1],
      ['B1', 'c1', 1],
    ]);
    expect(groups[0]!.content).toEqual({ authorId: 'alice', text: 'Spam build' });
    expect(groups[1]!.content).toEqual({ authorId: 'bob', text: 'buy gold' });
  });

  it('dry run changes nothing', async () => {
    expect(await removeContent(db, { buildId: 'B1' }, { backupDir })).toEqual({
      found: true,
      reports: 3,
      backup: null,
    });
    expect((await db.doc('builds/B1').get()).exists).toBe(true);
    expect(await status('B1_carol')).toBe('open');
  });

  it('removes a comment with the counter, backs it up, resolves only its reports', async () => {
    const result = await removeContent(
      db,
      { buildId: 'B1', commentId: 'c1' },
      { write: true, backupDir },
    );
    expect(result.reports).toBe(1);
    expect((await db.doc('builds/B1/comments/c1').get()).exists).toBe(false);
    expect((await db.doc('builds/B1').get()).get('commentCount')).toBe(1);
    expect(await status('c1_dave')).toBe('removed');
    expect(await status('B1_carol')).toBe('open');
    const backup = JSON.parse(readFileSync(result.backup!, 'utf8'));
    expect(backup).toMatchObject({
      path: 'builds/B1/comments/c1',
      data: { authorId: 'bob', text: 'buy gold' },
    });
  });

  it('removes a build with its likes and comments; all its reports resolve', async () => {
    const result = await removeContent(db, { buildId: 'B1' }, { write: true, backupDir });
    expect(result.reports).toBe(3);
    expect((await db.doc('builds/B1').get()).exists).toBe(false);
    expect((await db.collection('builds/B1/comments').get()).size).toBe(0);
    expect((await db.collection('builds/B1/likes').get()).size).toBe(0);
    expect((await db.doc('builds/B2').get()).exists).toBe(true);
    expect([await status('B1_carol'), await status('c1_dave')]).toEqual(['removed', 'removed']);
    const backup = JSON.parse(readFileSync(result.backup!, 'utf8'));
    expect(backup.comments).toHaveLength(2);
    expect(backup.likes[0]).toMatchObject({
      id: 'bob',
      createdAt: { timestamp: expect.any(String) },
    });
    expect(await listOpenReports(db)).toEqual([]);
  });

  it('dismisses a build’s reports but not its comments’', async () => {
    expect(await dismissReports(db, { buildId: 'B1' })).toEqual({ reports: 2 });
    expect(await status('B1_dave')).toBe('open');
    await dismissReports(db, { buildId: 'B1' }, { write: true });
    expect([await status('B1_dave'), await status('c1_dave')]).toEqual(['dismissed', 'open']);
    expect((await db.doc('builds/B1').get()).exists).toBe(true);
  });

  it('grants and revokes the admin claim by email or uid', async () => {
    const auth = getAuth(app);
    const user = await auth
      .getUserByEmail('mod@example.test')
      .catch(() => auth.createUser({ email: 'mod@example.test', password: 'test-password' }));
    await auth.setCustomUserClaims(user.uid, { beta: true });
    expect(await setAdmin(auth, 'mod@example.test', true)).toMatchObject({ after: true });
    expect((await auth.getUser(user.uid)).customClaims).toEqual({ beta: true });
    await setAdmin(auth, 'mod@example.test', true, { write: true });
    expect((await auth.getUser(user.uid)).customClaims).toEqual({ beta: true, admin: true });
    await setAdmin(auth, user.uid, false, { write: true });
    expect((await auth.getUser(user.uid)).customClaims).toEqual({ beta: true });
  });
});

describe('rename and delete-user (T18)', () => {
  const authUser = async (uid: string) => {
    const auth = getAuth(app);
    await auth.deleteUser(uid).catch(() => undefined);
    await auth.createUser({ uid, email: `${uid}@example.test`, displayName: 'Old' });
    return auth;
  };

  beforeEach(async () => {
    await db.doc('users/bob').set({ displayName: 'Anne Frankly', createdAt: at(1) });
  });

  it('renames: trimmed, 1–40 characters, dry run by default, Auth copy too', async () => {
    const auth = await authUser('bob');
    await expect(renameUser(db, auth, 'bob', '   ')).rejects.toThrow('1–40');
    await expect(renameUser(db, auth, 'bob', 'x'.repeat(41))).rejects.toThrow('1–40');
    await expect(renameUser(db, auth, 'nobody', 'Bob')).rejects.toThrow('No profile');
    expect(await renameUser(db, auth, 'bob', ' Bob ')).toEqual({
      uid: 'bob',
      before: 'Anne Frankly',
      after: 'Bob',
    });
    expect((await db.doc('users/bob').get()).get('displayName')).toBe('Anne Frankly');
    await renameUser(db, auth, 'bob', ' Bob ', { write: true });
    expect((await db.doc('users/bob').get()).get('displayName')).toBe('Bob');
    expect((await auth.getUser('bob')).displayName).toBe('Bob');
  });

  it('deletes a user and everything they published, with counters and a backup', async () => {
    const auth = await authUser('bob');
    await db.doc('builds/B1').update({ likeCount: 1, playerCount: 3, finishedCount: 1 });
    await db.doc('builds/B2').update({ playerCount: 1, finishedCount: 0 });
    await db.doc('builds/B3').set({ ownerId: 'bob', name: 'Bob build', commentCount: 1 });
    await db.doc('builds/B3/comments/c3').set({ authorId: 'carol', text: 'cool' });
    await db.doc('builds/B3/likes/carol').set({ userId: 'carol', createdAt: at(2) });
    await report('bob', 'B2', null, 4);
    await db
      .doc('users/bob/tracking/B1')
      .set({ collected: ['helm:1'], startedAt: at(3), completedAt: at(4) });
    await db
      .doc('users/bob/tracking/B2')
      .set({ collected: [], startedAt: at(3), completedAt: null });
    await db
      .doc('users/bob/tracking/B3')
      .set({ collected: [], startedAt: at(3), completedAt: null });

    const dry = await deleteUserData(db, auth, 'bob@example.test');
    expect(dry).toMatchObject({
      uid: 'bob',
      authUser: true,
      profile: true,
      builds: 1,
      likes: 1,
      comments: 1,
      reportsFiled: 1,
      reportsResolved: 1, // dave's report on c1
      tracking: 3,
      backup: null,
    });
    expect((await db.doc('builds/B3').get()).exists).toBe(true);

    const result = await deleteUserData(db, auth, 'bob', { write: true, backupDir });
    expect((await db.doc('users/bob').get()).exists).toBe(false);
    expect((await db.collection('users/bob/tracking').get()).size).toBe(0);
    expect((await db.doc('builds/B3').get()).exists).toBe(false);
    expect((await db.collection('builds/B3/comments').get()).size).toBe(0);
    const b1 = (await db.doc('builds/B1').get()).data();
    expect([b1?.likeCount, b1?.commentCount]).toEqual([0, 1]);
    expect([b1?.playerCount, b1?.finishedCount]).toEqual([2, 0]);
    expect((await db.doc('builds/B2').get()).get('playerCount')).toBe(0);
    expect((await db.doc('builds/B1/comments/c2').get()).exists).toBe(true);
    expect((await db.doc('reports/B2_bob').get()).exists).toBe(false);
    expect(await status('c1_dave')).toBe('removed');
    expect(await status('B1_carol')).toBe('open');
    await expect(auth.getUser('bob')).rejects.toMatchObject({ code: 'auth/user-not-found' });
    const backup = JSON.parse(readFileSync(result.backup!, 'utf8'));
    expect(backup.profile.displayName).toBe('Anne Frankly');
    expect(backup.builds[0].comments).toHaveLength(1);
    expect(backup.tracking[0]).toMatchObject({ path: 'users/bob/tracking/B1' });
    expect(backup.tracking).toHaveLength(3);
    expect(backup.comments[0]).toMatchObject({ path: 'builds/B1/comments/c1', text: 'buy gold' });

    // Re-running finds nothing and changes nothing.
    expect(await deleteUserData(db, auth, 'bob', { write: true, backupDir })).toMatchObject({
      authUser: false,
      profile: false,
      builds: 0,
      likes: 0,
      comments: 0,
    });
    expect((await db.doc('builds/B1').get()).get('commentCount')).toBe(1);
    expect((await db.doc('builds/B1').get()).get('playerCount')).toBe(2);
  });
});

describe('counts (T36)', () => {
  beforeEach(async () => {
    await db.recursiveDelete(db.collection('users'));
    const track = (uid: string, buildId: string, completedAt: Timestamp | null) =>
      db.doc(`users/${uid}/tracking/${buildId}`).set({ startedAt: at(1), completedAt });
    await track('ann', 'B1', null);
    await track('ben', 'B1', at(2));
    await track('cat', 'B1', at(3));
    await track('ann', 'GONE', null);
    // B1 is off by one; B2 is right; B3 is from before T36 (no counters).
    await db.doc('builds/B1').update({ playerCount: 2, finishedCount: 2 });
    await db.doc('builds/B2').update({ playerCount: 0, finishedCount: 0 });
    await db.doc('builds/B3').set({ ownerId: 'dave', name: 'Old build' });
  });

  it('recounts every build from the tracking docs, writing only with write', async () => {
    const dry = await recountTracking(db);
    expect(dry).toEqual({
      builds: 3,
      trackingDocs: 4,
      changes: [
        {
          buildId: 'B1',
          before: { playerCount: 2, finishedCount: 2 },
          after: { playerCount: 3, finishedCount: 2 },
        },
        {
          buildId: 'B3',
          before: { playerCount: null, finishedCount: null },
          after: { playerCount: 0, finishedCount: 0 },
        },
      ],
    });
    expect((await db.doc('builds/B3').get()).get('playerCount')).toBeUndefined();

    await recountTracking(db, { write: true });
    expect((await db.doc('builds/B1').get()).get('playerCount')).toBe(3);
    expect((await db.doc('builds/B3').get()).data()).toMatchObject({
      playerCount: 0,
      finishedCount: 0,
    });
    expect((await recountTracking(db)).changes).toEqual([]);
  });
});

describe('exportAll', () => {
  it('saves every document, subcollections included, with readable timestamps', async () => {
    // A subcollection under a parent doc that doesn't exist must still be found.
    await db.doc('builds/GHOST/comments/c9').set({ authorId: 'erin', text: 'orphan' });
    const dir = mkdtempSync(join(tmpdir(), 'soulsbuilds-export-'));
    const result = await exportAll(db, { dir, projectId: PROJECT_ID });
    const { docs, projectId } = JSON.parse(readFileSync(result.file, 'utf8'));

    expect(projectId).toBe(PROJECT_ID);
    expect(docs['builds/B1']).toEqual({ ownerId: 'alice', name: 'Spam build', commentCount: 2 });
    expect(docs['builds/B1/comments/c2']).toEqual({ authorId: 'carol', text: 'nice' });
    expect(docs['builds/B1/likes/bob']).toEqual({
      userId: 'bob',
      createdAt: { timestamp: '2026-11-01T00:00:00.000Z' },
    });
    expect(docs['builds/GHOST']).toBeUndefined();
    expect(docs['builds/GHOST/comments/c9']).toEqual({ authorId: 'erin', text: 'orphan' });
    expect(docs['reports/c1_dave']).toMatchObject({ reason: 'spam', status: 'open' });

    expect(result.counts['builds']).toBe(2);
    expect(result.counts['builds/*/comments']).toBe(3);
    expect(result.counts['reports']).toBe(3);
    expect(result.total).toBe(Object.keys(docs).length);
  });
});

describe('stats (T20)', () => {
  beforeEach(async () => {
    await db.recursiveDelete(db.collection('builds'));
    await db.recursiveDelete(db.collection('users'));
    await db.recursiveDelete(db.collection('stats'));
    const build = (id: string, ownerId: string, tags: string[], game = 'elden-ring') =>
      db.doc(`builds/${id}`).set({ ownerId, game, tags, name: id });
    await build('S1', 'alice', ['Malenia', 'Mohg']);
    await build('S2', 'alice', ['Malenia']);
    await build('S3', 'bob', ['Malenia', 'Malenia', 'PvP']);
    await build('S4', 'carol', ['Malenia'], 'dark-souls-3');
    await Promise.all(
      ['alice', 'bob', 'dave'].map((uid) =>
        db.doc(`users/${uid}`).set({ displayName: uid, createdAt: at(1) }),
      ),
    );
  });

  it('counts one game’s builds, distinct authors, builds per tag and all accounts', async () => {
    expect(await computeStats(db, 'elden-ring')).toEqual({
      buildCount: 3,
      authorCount: 2,
      userCount: 3,
      tagCounts: { Malenia: 3, Mohg: 1, PvP: 1 },
    });
  });

  it('writes stats/<game> only with write, with a server updatedAt', async () => {
    await updateStats(db);
    expect((await db.doc('stats/elden-ring').get()).exists).toBe(false);

    const result = await updateStats(db, { write: true });
    const saved = (await db.doc('stats/elden-ring').get()).data()!;
    expect(saved).toMatchObject(result['elden-ring']!);
    expect(saved.updatedAt).toBeInstanceOf(Timestamp);
  });
});
