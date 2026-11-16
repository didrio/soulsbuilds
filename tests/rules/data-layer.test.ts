// The app's real data-layer functions (src/lib/firebase/) against firestore.rules in the emulator,
// signed in as different users: proves every write the UI makes is one the rules allow, and that
// the ones it shouldn't make are refused. `npm run test:rules`.
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { BuildInput } from '@/lib/firebase/builds';

// The data layer reads `firestore` from ./app; point it at whichever user the test acts as.
const current = vi.hoisted(() => ({ firestore: undefined as unknown }));
vi.mock('@/lib/firebase/app', () => ({
  get firestore() {
    return current.firestore;
  },
}));

const {
  createBuild,
  deleteBuild,
  getBuild,
  listBuilds,
  listUserBuilds,
  searchBuilds,
  updateBuild,
} = await import('@/lib/firebase/builds');
const { hasLiked, likeBuild, listLikedBuildIds, unlikeBuild } =
  await import('@/lib/firebase/likes');
const { addComment, deleteComment, listComments } = await import('@/lib/firebase/comments');
const { reportContent } = await import('@/lib/firebase/reports');
const { deleteAccountData, findAccountData } = await import('@/lib/firebase/account');
const { createUserProfile, getUserProfile, getUserProfiles, updateDisplayName } =
  await import('@/lib/firebase/users');
const { getGameStats } = await import('@/lib/firebase/stats');
const { deleteTracking, getTracking, listTrackingRefs, saveTracking } =
  await import('@/lib/firebase/tracking');

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-soulsbuilds-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
  await env.clearFirestore();
});
afterAll(() => env.cleanup());

const actAs = (uid: string | null) => {
  current.firestore = (uid
    ? env.authenticatedContext(uid)
    : env.unauthenticatedContext()
  ).firestore() as unknown as Firestore;
};

const input: BuildInput = {
  name: '  Carian Moon Knight ',
  description: 'Moonveil and full-moon sorceries.',
  tags: ['Rennala'],
  stats: { vigor: 40, mind: 30, end: 15, str: 12, dex: 18, int: 80, fai: 7, arc: 9 },
  startingClass: 3004, // Astrologer
  equipment: {
    weapons: [9060000, null, null, 33090000, null, null], // Moonveil, Carian Regal Scepter
    weaponAffinities: [null, null, null, null, null, null],
    weaponSkills: [null, null, null, null, null, null],
    arrows: [null, null, null, null],
    talismans: [3001], // Graven-Mass Talisman
    spells: [4000], // Glintstone Pebble
    tears: [],
    consumables: [],
    helm: null,
    chest: 580100, // Lusat's Robe
    gauntlet: null,
    leg: null,
    greatRune: null,
    spiritAsh: 207000, // Mimic Tear Ashes
  },
};

describe('data layer against the rules', () => {
  let buildId = '';

  it('profiles: create, read, rename', async () => {
    actAs('alice');
    await createUserProfile('alice', ' Alice ');
    actAs('bob');
    await createUserProfile('bob', 'Bob');
    await expect(createUserProfile('alice', 'Not Alice')).rejects.toThrow();
    await updateDisplayName('bob', 'Bobby');
    actAs(null);
    expect((await getUserProfile('alice'))?.displayName).toBe('Alice');
    expect(Object.keys(await getUserProfiles(['alice', 'bob', 'alice', 'nobody'])).sort()).toEqual([
      'alice',
      'bob',
    ]);
    expect(await getUserProfile('nobody')).toBeNull();
  });

  it('builds: create (trimmed name, computed level) and read', async () => {
    actAs('alice');
    buildId = await createBuild('alice', input);
    expect(buildId).toMatch(/^[0-9A-Z]{12}$/);
    actAs(null);
    const build = await getBuild(buildId);
    expect(build).toMatchObject({
      ownerId: 'alice',
      game: 'elden-ring',
      name: 'Carian Moon Knight',
      level: 132,
      startingClass: 3004,
      likeCount: 0,
      commentCount: 0,
    });
    expect(build?.createdAt).toBeInstanceOf(Date);
    expect(await getBuild('NOPE')).toBeNull();
  });

  it('builds: only the owner edits, and edits keep the counts', async () => {
    actAs('bob');
    await expect(updateBuild(buildId, { ...input, name: 'Hijacked' })).rejects.toThrow();
    await expect(createBuild('alice', input)).rejects.toThrow();
    actAs('alice');
    await updateBuild(buildId, {
      ...input,
      name: 'Moon Knight',
      stats: { ...input.stats, int: 60 },
    });
    expect(await getBuild(buildId)).toMatchObject({ name: 'Moon Knight', level: 112 });
    await updateBuild(buildId, { ...input, name: 'Moon Knight', startingClass: null });
    expect(await getBuild(buildId)).toMatchObject({ startingClass: null });
  });

  it('likes: like once, list, unlike', async () => {
    actAs('bob');
    await likeBuild(buildId, 'bob');
    await expect(likeBuild(buildId, 'bob')).rejects.toThrow();
    expect(await hasLiked(buildId, 'bob')).toBe(true);
    expect((await getBuild(buildId))?.likeCount).toBe(1);
    expect(await listLikedBuildIds('bob')).toEqual([buildId]);
    actAs('alice');
    await expect(unlikeBuild(buildId, 'bob')).rejects.toThrow();
    actAs('bob');
    await unlikeBuild(buildId, 'bob');
    expect(await hasLiked(buildId, 'bob')).toBe(false);
    expect((await getBuild(buildId))?.likeCount).toBe(0);
    await likeBuild(buildId, 'bob');
  });

  it('comments: post (trimmed), list newest first, delete own only', async () => {
    actAs(null);
    await expect(addComment(buildId, 'bob', 'anonymous')).rejects.toThrow();
    actAs('bob');
    const first = await addComment(buildId, 'bob', '  Nice build!  ');
    expect(first.text).toBe('Nice build!');
    actAs('alice');
    await addComment(buildId, 'alice', 'Thanks!');
    await expect(deleteComment(buildId, first.id)).rejects.toThrow();
    const comments = await listComments(buildId);
    expect(comments.map((c) => c.text)).toEqual(['Thanks!', 'Nice build!']);
    expect((await getBuild(buildId))?.commentCount).toBe(2);
    actAs('bob');
    await deleteComment(buildId, first.id);
    expect((await getBuild(buildId))?.commentCount).toBe(1);
  });

  it('reports: once per user per target, on builds and comments', async () => {
    actAs('carol');
    const [comment] = await listComments(buildId);
    await expect(reportContent('carol', { buildId }, 'spam', '  ads  ')).resolves.toBe('reported');
    await expect(reportContent('carol', { buildId }, 'other')).resolves.toBe('already-reported');
    await expect(
      reportContent('carol', { buildId, commentId: comment!.id }, 'harassment'),
    ).resolves.toBe('reported');
    await expect(reportContent('carol', { buildId: 'NOPE' }, 'spam')).rejects.toThrow();
    actAs(null);
    await expect(reportContent('carol', { buildId }, 'spam')).rejects.toThrow();
  });

  it('lists: top, new, by tag, by owner', async () => {
    actAs('alice');
    const second = await createBuild('alice', { ...input, name: 'Second', tags: ['Godrick'] });
    actAs(null);
    expect((await listBuilds({ sort: 'top' })).builds.map((b) => b.id)).toEqual([buildId, second]);
    expect((await listBuilds({ sort: 'new' })).builds.map((b) => b.id)).toEqual([second, buildId]);
    expect((await listBuilds({ tag: 'Godrick' })).builds.map((b) => b.id)).toEqual([second]);
    const page = await listBuilds({ sort: 'new', pageSize: 1 });
    expect(page.builds.map((b) => b.id)).toEqual([second]);
    const next = await listBuilds({ sort: 'new', pageSize: 1, cursor: page.nextCursor });
    expect(next.builds.map((b) => b.id)).toEqual([buildId]);
    expect((await listUserBuilds('alice')).map((b) => b.id)).toEqual([second, buildId]);
    expect((await searchBuilds('  MOON ')).builds.map((b) => b.name)).toEqual(['Moon Knight']);
    expect((await searchBuilds('sec')).builds.map((b) => b.id)).toEqual([second]);
    expect((await searchBuilds('nothing like this')).builds).toEqual([]);
    expect(await listUserBuilds('bob')).toEqual([]);
  });

  it('lists: level range, search with a tag, all in the query', async () => {
    actAs('alice');
    const low = await createBuild('alice', {
      ...input,
      name: 'Moon Squire',
      tags: ['Godrick'],
      stats: { ...input.stats, vigor: 10, mind: 10, int: 20 },
    });
    actAs(null);
    const lowLevel = (await getBuild(low))!.level;
    expect(lowLevel).toBeLessThan(132);
    const ids = async (p: Promise<{ builds: { id: string }[] }>) =>
      (await p).builds.map((b) => b.id);
    // min only, max only, both; with either sort, a tag, and search
    expect(await ids(listBuilds({ sort: 'top', minLevel: 100 }))).not.toContain(low);
    expect(await ids(listBuilds({ sort: 'new', minLevel: 100 }))).toContain(buildId);
    expect(await ids(listBuilds({ sort: 'new', maxLevel: lowLevel }))).toEqual([low]);
    expect(await ids(listBuilds({ minLevel: lowLevel, maxLevel: lowLevel }))).toEqual([low]);
    expect(await ids(listBuilds({ tag: 'Godrick', minLevel: 100 }))).not.toContain(low);
    expect(await ids(listBuilds({ tag: 'Godrick', maxLevel: 131 }))).toEqual([low]);
    expect(await ids(searchBuilds('moon', { maxLevel: 131 }))).toEqual([low]);
    expect(await ids(searchBuilds('moon', { tag: 'Godrick' }))).toEqual([low]);
    expect(await ids(searchBuilds('moon', { tag: 'Rennala', minLevel: 100 }))).toEqual([buildId]);
    expect(await ids(searchBuilds('moon', { tag: 'Rennala', maxLevel: 50 }))).toEqual([]);
    // a page is full of matches, not of a page of everything filtered afterwards
    const first = await listBuilds({ sort: 'new', minLevel: 132, pageSize: 1 });
    expect(first.builds.map((b) => b.level)).toEqual([132]);
    actAs('alice');
    await deleteBuild(low);
  });

  it('delete: only the owner, and the likes and comments go with it', async () => {
    actAs('bob');
    await expect(deleteBuild(buildId)).rejects.toThrow();
    actAs('alice');
    await deleteBuild(buildId);
    actAs(null);
    expect(await getBuild(buildId)).toBeNull();
    expect(await listComments(buildId)).toEqual([]);
    expect(await listLikedBuildIds('bob')).toEqual([]);
  });
});

describe('stats (T20)', () => {
  it('reads a game’s stats, or null before the daily job has written them', async () => {
    actAs(null);
    expect(await getGameStats('elden-ring')).toBeNull();
    await env.withSecurityRulesDisabled((context) =>
      setDoc(doc(context.firestore() as unknown as Firestore, 'stats/elden-ring'), {
        buildCount: 3,
        authorCount: 2,
        userCount: 5,
        tagCounts: { Malenia: 2 },
        updatedAt: Timestamp.fromMillis(Date.UTC(2026, 10, 16)),
      }),
    );
    expect(await getGameStats('elden-ring')).toEqual({
      buildCount: 3,
      authorCount: 2,
      userCount: 5,
      tagCounts: { Malenia: 2 },
      updatedAt: new Date(Date.UTC(2026, 10, 16)),
    });
  });
});

describe('tracking (T34)', () => {
  const state = {
    collected: ['helm:680000'],
    seen: ['helm:680000', 'talisman:2160'],
    stats: { vigor: 30, mind: 10, end: 20, str: 12, dex: 30, int: 9, fai: 8, arc: 30 },
    startedAt: new Date('2026-11-10T12:00:00Z'),
    completedAt: null,
  };

  it('saves, reads back, updates and deletes the player’s own progress only', async () => {
    actAs('gus');
    expect(await getTracking('gus', 'B9')).toBeNull();
    await saveTracking('gus', 'B9', state);
    expect(await getTracking('gus', 'B9')).toEqual(state);
    const done = { ...state, collected: [...state.seen], completedAt: new Date('2026-11-16') };
    await saveTracking('gus', 'B9', done);
    expect(await getTracking('gus', 'B9')).toEqual(done);
    expect(await listTrackingRefs('gus')).toHaveLength(1);

    actAs('hal');
    await expect(getTracking('gus', 'B9')).rejects.toThrow();
    await expect(saveTracking('gus', 'B9', state)).rejects.toThrow();
    await expect(deleteTracking('gus', 'B9')).rejects.toThrow();

    actAs('gus');
    await deleteTracking('gus', 'B9');
    expect(await getTracking('gus', 'B9')).toBeNull();
  });
});

describe('account deletion (T18)', () => {
  it('removes everything of the user, keeps counters right, and can run again', async () => {
    actAs('dana');
    await createUserProfile('dana', 'Dana');
    const own = await createBuild('dana', { ...input, name: 'Dana build' });
    actAs('erin');
    await createUserProfile('erin', 'Erin');
    const erins = await createBuild('erin', { ...input, name: 'Erin build' });
    const orphaned = await createBuild('erin', { ...input, name: 'Erin old build' });
    await likeBuild(own, 'erin');
    await addComment(own, 'erin', 'Nice one');
    await likeBuild(erins, 'erin');
    const erinsComment = await addComment(erins, 'erin', 'My notes');

    actAs('dana');
    await likeBuild(erins, 'dana');
    await addComment(erins, 'dana', 'First');
    await addComment(erins, 'dana', 'Second');
    await likeBuild(orphaned, 'dana');
    await addComment(orphaned, 'dana', 'Old');
    await reportContent('dana', { buildId: erins, commentId: erinsComment.id }, 'spam');
    await saveTracking('dana', erins, {
      collected: [],
      seen: [],
      stats: input.stats,
      startedAt: new Date(),
      completedAt: null,
    });
    // A build whose like/comment cleanup was cut short: the doc is gone, its subcollections not.
    await env.withSecurityRulesDisabled(async (context) => {
      await deleteDoc(doc(context.firestore() as unknown as Firestore, 'builds', orphaned));
    });

    // Nobody else can delete Dana's data (the first step, her build, is refused).
    actAs('erin');
    await expect(deleteAccountData('dana')).rejects.toThrow();
    expect(await getBuild(own)).not.toBeNull();

    actAs('dana');
    const found = await findAccountData('dana');
    expect(found.buildIds).toEqual([own]);
    expect(found.likes.map((l) => l.buildExists).sort()).toEqual([false, true]);
    expect(found.comments).toHaveLength(3);
    expect(found.reports).toHaveLength(1);
    expect(found.tracking).toHaveLength(1);

    const progress = vi.fn();
    await deleteAccountData('dana', progress);
    // 1 build, 2 likes, 3 comments, 1 report, 1 tracked build, profile
    expect(progress).toHaveBeenLastCalledWith(9, 9);

    actAs(null);
    expect(await getUserProfile('dana')).toBeNull();
    expect(await getBuild(own)).toBeNull();
    expect(await listUserBuilds('dana')).toEqual([]);
    expect(await listLikedBuildIds('dana')).toEqual([]);
    const after = await getBuild(erins);
    expect(after?.likeCount).toBe(1);
    expect(after?.commentCount).toBe(1);
    expect((await listComments(erins)).map((c) => c.authorId)).toEqual(['erin']);
    expect(await listLikedBuildIds('erin')).toEqual([erins]);
    expect(await getUserProfile('erin')).not.toBeNull();

    actAs('dana');
    expect(await findAccountData('dana')).toEqual({
      buildIds: [],
      likes: [],
      comments: [],
      reports: [],
      tracking: [],
    });
    // Running it again (e.g. after a failure halfway) is a no-op.
    await deleteAccountData('dana');
    expect((await getBuild(erins))?.commentCount).toBe(1);
  });
});
