// The app's real data-layer functions (src/lib/firebase/) against firestore.rules in the emulator,
// signed in as different users: proves every write the UI makes is one the rules allow, and that
// the ones it shouldn't make are refused. `npm run test:rules`.
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  deleteField,
  doc,
  setDoc,
  Timestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
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
  getBuildsByIds,
  listBuilds,
  listBuildsByWeapon,
  listUserBuilds,
  searchBuilds,
  updateBuild,
} = await import('@/lib/firebase/builds');
const { hasLiked, likeBuild, listLikedBuildIds, unlikeBuild } =
  await import('@/lib/firebase/likes');
const {
  addComment,
  deleteComment,
  fetchLatestComment,
  likeComment,
  listCommentLikes,
  listComments,
  unlikeComment,
} = await import('@/lib/firebase/comments');
const { reportContent } = await import('@/lib/firebase/reports');
const { deleteAccountData, findAccountData } = await import('@/lib/firebase/account');
const { createUserProfile, getUserProfile, getUserProfiles, updateDisplayName } =
  await import('@/lib/firebase/users');
const { getGameStats } = await import('@/lib/firebase/stats');
const { deleteTracking, getTracking, listTracking, saveTracking, tracksAnyBuild } =
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
  image: { kind: 'spell', id: 4000 }, // T40: Glintstone Pebble as the build image
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
      image: { kind: 'spell', id: 4000 },
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
    await updateBuild(buildId, { ...input, name: 'Moon Knight', image: null });
    expect(await getBuild(buildId)).toMatchObject({ image: null });
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
    expect(await fetchLatestComment(buildId)).toBeNull();
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
    // The newest one alone (T49), readable signed out.
    actAs(null);
    expect((await fetchLatestComment(buildId))?.text).toBe('Thanks!');
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

  it('lists: by weapon in any hand, most liked first (T55)', async () => {
    actAs('alice');
    // Moonveil in the left hand only; the Uchigatana in the right
    const offHand = await createBuild('alice', {
      ...input,
      name: 'Two Katanas',
      equipment: { ...input.equipment, weapons: [9000000, null, null, null, 9060000, null] },
    });
    actAs(null);
    const ids = async (p: Promise<{ builds: { id: string }[] }>) =>
      (await p).builds.map((b) => b.id);
    const moonveil = await ids(listBuildsByWeapon(9060000));
    expect(moonveil).toHaveLength(3);
    expect(moonveil[0]).toBe(buildId); // the liked one
    expect(moonveil).toContain(offHand);
    expect(await ids(listBuildsByWeapon(9000000))).toEqual([offHand]);
    expect(await ids(listBuildsByWeapon(33090000))).not.toContain(offHand);
    expect(await ids(listBuildsByWeapon(1))).toEqual([]);
    const page = await listBuildsByWeapon(9060000, { pageSize: 2 });
    const next = await listBuildsByWeapon(9060000, { pageSize: 2, cursor: page.nextCursor });
    expect([...page.builds, ...next.builds].map((b) => b.id).sort()).toEqual([...moonveil].sort());
    actAs('alice');
    await deleteBuild(offHand);
  });

  it('lists: ties newest first, a weapon with a level range, builds by ids (T74)', async () => {
    actAs('alice');
    const older = await createBuild('alice', { ...input, name: 'Tie Older' });
    const newer = await createBuild('alice', { ...input, name: 'Tie Newer', tags: ['Godrick'] });
    actAs(null);
    const ids = async (p: Promise<{ builds: { id: string }[] }>) =>
      (await p).builds.map((b) => b.id);
    const before = (list: string[]) => list.indexOf(newer) < list.indexOf(older);
    // Both have no likes and no players: the newer one leads either count order.
    expect(before(await ids(listBuilds({ sort: 'top' })))).toBe(true);
    expect(before(await ids(listBuilds({ sort: 'played' })))).toBe(true);
    // A weapon goes to Firestore with the level range; the tag is the caller's to filter then.
    const level = (await getBuild(older))!.level;
    expect(
      await ids(listBuilds({ sort: 'new', weaponId: 9060000, minLevel: level, maxLevel: level })),
    ).toEqual(expect.arrayContaining([newer, older]));
    expect(await ids(listBuilds({ weaponId: 9060000, tag: 'Godrick' }))).toContain(older);
    expect(await ids(listBuilds({ weaponId: 1 }))).toEqual([]);
    // By ids: in the order asked, deleted or unknown ids left out.
    expect((await getBuildsByIds([newer, 'NOSUCHBUILD1', older])).map((b) => b.id)).toEqual([
      newer,
      older,
    ]);
    expect(await getBuildsByIds([])).toEqual([]);
    actAs('alice');
    await deleteBuild(older);
    await deleteBuild(newer);
  });

  it('replies and comment likes (T62)', async () => {
    actAs('bob');
    const top = await addComment(buildId, 'bob', 'Does it work at level 60?');
    expect(top).toMatchObject({ parentId: null, likeCount: 0 });
    actAs('alice');
    const reply = await addComment(buildId, 'alice', 'Yes, with the Uchigatana', top.id);
    expect(reply.parentId).toBe(top.id);
    // One level: a reply to a reply is refused.
    await expect(addComment(buildId, 'alice', 'deeper', reply.id)).rejects.toThrow();

    await likeComment(buildId, top.id, 'alice');
    await likeComment(buildId, reply.id, 'alice');
    await expect(likeComment(buildId, top.id, 'alice')).rejects.toThrow();
    await expect(likeComment(buildId, top.id, 'bob')).rejects.toThrow();
    expect(await listCommentLikes(buildId, 'alice')).toEqual(new Set([top.id, reply.id]));
    await unlikeComment(buildId, reply.id, 'alice');
    expect(await listCommentLikes(buildId, 'alice')).toEqual(new Set([top.id]));
    actAs(null);
    const comments = await listComments(buildId);
    expect(comments.find((c) => c.id === top.id)?.likeCount).toBe(1);
    expect(comments.find((c) => c.id === reply.id)).toMatchObject({
      likeCount: 0,
      parentId: top.id,
    });
  });

  it('delete: only the owner, and the likes, comments and comment likes go with it', async () => {
    actAs('bob');
    await expect(deleteBuild(buildId)).rejects.toThrow();
    actAs('alice');
    await deleteBuild(buildId);
    actAs(null);
    expect(await getBuild(buildId)).toBeNull();
    expect(await listComments(buildId)).toEqual([]);
    expect(await listCommentLikes(buildId, 'alice')).toEqual(new Set());
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

describe('tracking (T34) and the build’s counters (T36)', () => {
  const state = {
    collected: ['helm:680000'],
    seen: ['helm:680000', 'talisman:2160'],
    marked: ['gate:margit', 'keyItems:8590'],
    stats: { vigor: 30, mind: 10, end: 20, str: 12, dex: 30, int: 9, fai: 8, arc: 30 },
    startedAt: new Date('2026-11-10T12:00:00Z'),
    completedAt: null,
  };
  const counters = async (id: string) => {
    const build = await getBuild(id);
    return [build?.playerCount, build?.finishedCount];
  };

  it('saves, reads back, updates and deletes the player’s own progress only', async () => {
    actAs('ivy');
    const B9 = await createBuild('ivy', { ...input, name: 'Tracked' });
    actAs('gus');
    expect(await getTracking('gus', B9)).toBeNull();
    expect(await tracksAnyBuild('gus')).toBe(false);
    await saveTracking('gus', B9, state, 'none');
    expect(await counters(B9)).toEqual([1, 0]);
    expect(await tracksAnyBuild('gus')).toBe(true);
    expect(await getTracking('gus', B9)).toEqual(state);
    await saveTracking('gus', B9, { ...state, collected: [] }, 'playing');
    // A doc saved before T44 has no marks: it reads back with none.
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore() as unknown as Firestore, 'users/gus/tracking', B9), {
        marked: deleteField(),
      });
    });
    expect((await getTracking('gus', B9))?.marked).toEqual([]);
    const done = { ...state, collected: [...state.seen], completedAt: new Date('2026-11-16') };
    await saveTracking('gus', B9, done, 'playing');
    expect(await getTracking('gus', B9)).toEqual(done);
    expect(await counters(B9)).toEqual([1, 1]);
    expect(await listTracking('gus')).toEqual([{ buildId: B9, state: done }]);
    // "Most played" (T36): the tracked build comes first, then the rest (all at 0).
    const played = (await listBuilds({ sort: 'played' })).builds.map((b) => b.id);
    expect(played[0]).toBe(B9);
    expect((await listBuilds({ sort: 'played', minLevel: 100 })).builds[0]?.id).toBe(B9);
    // A save that has the database's status wrong is refused (the app then refetches).
    await expect(saveTracking('gus', B9, done, 'none')).rejects.toThrow();

    actAs('hal');
    await expect(getTracking('gus', B9)).rejects.toThrow();
    await expect(tracksAnyBuild('gus')).rejects.toThrow();
    await expect(saveTracking('gus', B9, state, 'none')).rejects.toThrow();
    await expect(deleteTracking('gus', B9, 'finished')).rejects.toThrow();

    actAs('gus');
    await deleteTracking('gus', B9, 'finished');
    expect(await getTracking('gus', B9)).toBeNull();
    expect(await tracksAnyBuild('gus')).toBe(false);
    expect(await counters(B9)).toEqual([0, 0]);
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
    // Comment likes (T62): on Erin's comment, on her own reply there, and on Erin's comment on
    // Dana's own build (which goes with that build).
    const danasReply = await addComment(erins, 'dana', 'Agreed', erinsComment.id);
    await likeComment(erins, erinsComment.id, 'dana');
    await likeComment(erins, danasReply.id, 'dana');
    const onOwn = (await listComments(own))[0]!;
    await likeComment(own, onOwn.id, 'dana');
    const progress0 = {
      collected: [],
      seen: [],
      marked: [],
      stats: input.stats,
      startedAt: new Date(),
      completedAt: null,
    };
    await saveTracking('dana', erins, { ...progress0, completedAt: new Date() }, 'none');
    await saveTracking('dana', own, progress0, 'none');
    await saveTracking('dana', orphaned, progress0, 'none');
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
    expect(found.comments).toHaveLength(4);
    expect(found.commentLikes.map((l) => l.comment !== null)).toEqual([true, true]);
    expect(found.reports).toHaveLength(1);
    expect(
      found.tracking.sort((a, b) => (a.buildId === erins ? -1 : b.buildId === erins ? 1 : 0)),
    ).toEqual([
      { buildId: erins, counted: 'finished' },
      expect.objectContaining({ counted: 'none' }),
      expect.objectContaining({ counted: 'none' }),
    ]);

    const progress = vi.fn();
    await deleteAccountData('dana', progress);
    // 1 build, 2 likes, 4 comments, 2 comment likes, 1 report, 3 tracked builds, profile
    expect(progress).toHaveBeenLastCalledWith(14, 14);

    actAs(null);
    expect(await getUserProfile('dana')).toBeNull();
    expect(await getBuild(own)).toBeNull();
    expect(await listUserBuilds('dana')).toEqual([]);
    expect(await listLikedBuildIds('dana')).toEqual([]);
    const after = await getBuild(erins);
    expect(after?.likeCount).toBe(1);
    expect(after?.commentCount).toBe(1);
    expect([after?.playerCount, after?.finishedCount]).toEqual([0, 0]);
    expect((await listComments(erins)).map((c) => [c.authorId, c.likeCount])).toEqual([
      ['erin', 0],
    ]);
    expect(await listCommentLikes(erins, 'dana')).toEqual(new Set());
    expect(await listLikedBuildIds('erin')).toEqual([erins]);
    expect(await getUserProfile('erin')).not.toBeNull();

    actAs('dana');
    expect(await findAccountData('dana')).toEqual({
      buildIds: [],
      likes: [],
      comments: [],
      commentLikes: [],
      reports: [],
      tracking: [],
    });
    // Running it again (e.g. after a failure halfway) is a no-op.
    await deleteAccountData('dana');
    expect((await getBuild(erins))?.commentCount).toBe(1);
  });
});
