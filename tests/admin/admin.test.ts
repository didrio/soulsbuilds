// scripts/admin.mjs against the emulators: reports listing, remove (with backups and counters),
// dismiss, the admin claim, and export. `npm run test:rules`.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  dismissReports,
  exportAll,
  listOpenReports,
  removeContent,
  setAdmin,
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
