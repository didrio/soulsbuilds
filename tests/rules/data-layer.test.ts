// The app's real data-layer functions (src/lib/firebase/) against firestore.rules in the emulator,
// signed in as different users: proves every write the UI makes is one the rules allow, and that
// the ones it shouldn't make are refused. `npm run test:rules`.
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import type { Firestore } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { BuildInput } from '@/lib/firebase/builds';

// The data layer reads `firestore` from ./app; point it at whichever user the test acts as.
const current = vi.hoisted(() => ({ firestore: undefined as unknown }));
vi.mock('@/lib/firebase/app', () => ({
  get firestore() {
    return current.firestore;
  },
}));

const { createBuild, deleteBuild, getBuild, listBuilds, listUserBuilds, updateBuild } =
  await import('@/lib/firebase/builds');
const { hasLiked, likeBuild, listLikedBuildIds, unlikeBuild } =
  await import('@/lib/firebase/likes');
const { addComment, deleteComment, listComments } = await import('@/lib/firebase/comments');
const { createUserProfile, getUserProfile, getUserProfiles, updateDisplayName } =
  await import('@/lib/firebase/users');

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
  equipment: {
    weapons: ['Moonveil', null, null, 'Carian Regal Scepter', null, null],
    weaponAffinities: [null, null, null, null, null, null],
    weaponSkills: [null, null, null, null, null, null],
    arrows: [null, null, null, null],
    talismans: ['Graven-Mass Talisman'],
    spells: ["Rennala's Full Moon"],
    tears: [],
    consumables: [],
    helm: null,
    chest: "Lusat's Robe",
    gauntlet: null,
    leg: null,
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
    expect(await listUserBuilds('bob')).toEqual([]);
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
