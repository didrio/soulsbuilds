// The rules' expression budget on builds (T42). Firestore evaluates at most 1,000 expressions per
// request and past that denies with a bare PERMISSION_DENIED, so a legitimate build could fail to
// save with no hint why. This file runs the costliest legitimate build writes with N padding
// comparisons (`1 == 1 && …`, ~4 expressions each) added at the top of validContent:
//
// - `npm run test:rules` asserts each still passes with N = HEADROOM, the headroom we keep.
//   A change that spends budget (a new field, a new check) measures what it spends and lowers
//   HEADROOM by that much, knowingly; firestore.rules and docs/firebase.md record the numbers.
// - `RULES_BUDGET=measure npm run test:rules` prints the largest N each write passes with.
//   Add RULES_FILE=<path> to measure a variant of the rules without editing firestore.rules.
// Only the emulator's "maximum of 1000 expressions" denial counts as over budget; any other denial
// fails the test, since it means the case itself is invalid.
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  doc,
  serverTimestamp,
  setDoc,
  setLogLevel,
  Timestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * Padding comparisons every worst case below must still pass with. Measured at T42: 93 (create,
 * level 131), 95 (create, level 1), 99 and 100 (the edits).
 */
const HEADROOM = 90;

const MEASURE = process.env.RULES_BUDGET === 'measure';
setLogLevel('silent'); // every probe past the budget would log its denial
const PROJECT_ID = 'demo-soulsbuilds-test';
const RULES = readFileSync(process.env.RULES_FILE ?? 'firestore.rules', 'utf8');
const ANCHOR = 'function validContent(d) {\n      return ';

/** firestore.rules with `n` padding comparisons at the top of validContent. */
const padded = (n: number) => {
  if (!RULES.includes(ANCHOR)) {
    throw new Error('validContent changed shape: update ANCHOR in tests/rules/budget.test.ts');
  }
  return n > 0 ? RULES.replace(ANCHOR, `${ANCHOR}${padding(n)} && `) : RULES;
};

/**
 * `n` comparisons joined by `&&`, as a balanced tree: a flat chain past ~100 terms fails to compile
 * ("Expression is too complex to evaluate safely"). Same count of `==` and `&&` either way.
 */
const padding = (n: number): string =>
  n === 1 ? '1 == 1' : `(${padding(Math.floor(n / 2))} && ${padding(n - Math.floor(n / 2))})`;

// Every slot filled, every list at its maximum, an image and a starting class: the most reads.
const fullEquipment = {
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

const HIGH = { vigor: 50, mind: 15, end: 25, str: 18, dex: 40, int: 9, fai: 8, arc: 45 }; // level 131
const LOW = { vigor: 1, mind: 1, end: 1, str: 1, dex: 1, int: 1, fai: 1, arc: 1 }; // sums below 80

const fullContent = (level: 'high' | 'low') => ({
  name: 'Worst Case',
  nameLower: 'worst case',
  description: 'Every slot filled.',
  tags: Array.from({ length: 20 }, (_, i) => `tag${i}`),
  level: level === 'high' ? 131 : 1,
  stats: level === 'high' ? HIGH : LOW,
  startingClass: 3009,
  equipment: fullEquipment,
  image: { kind: 'spiritAsh', id: 207000 },
});

const counters = { likeCount: 0, commentCount: 0, playerCount: 0, finishedCount: 0 };

/** A small build of Alice's, already saved, for the edits to rewrite. */
const smallBuild = {
  name: 'Small',
  nameLower: 'small',
  description: '',
  tags: [],
  level: 1,
  stats: LOW,
  startingClass: null,
  equipment: {
    ...fullEquipment,
    weapons: [null, null, null, null, null, null],
    weaponAffinities: [null, null, null, null, null, null],
    weaponSkills: [null, null, null, null, null, null],
    arrows: [null, null, null, null],
    talismans: [],
    spells: [],
    tears: [],
    consumables: [],
    helm: null,
    chest: null,
    gauntlet: null,
    leg: null,
    greatRune: null,
    spiritAsh: null,
  },
  image: null,
  ownerId: 'alice',
  game: 'elden-ring',
  ...counters,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

type Case = {
  name: string;
  seed?: (db: Firestore) => Promise<unknown>;
  write: (db: Firestore) => Promise<unknown>;
};

const cases: Case[] = (['high', 'low'] as const).flatMap((level) => [
  {
    name: `create, every slot filled, level ${level === 'high' ? 131 : 1}`,
    write: (db: Firestore) =>
      setDoc(doc(db, 'builds/N1'), {
        ...fullContent(level),
        ownerId: 'alice',
        game: 'elden-ring',
        ...counters,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
  },
  {
    name: `owner edit filling every slot, level ${level === 'high' ? 131 : 1}`,
    seed: (db: Firestore) => setDoc(doc(db, 'builds/B1'), smallBuild),
    write: (db: Firestore) =>
      updateDoc(doc(db, 'builds/B1'), { ...fullContent(level), updatedAt: serverTimestamp() }),
  },
]);

/** Whether the case's write passes with `n` padding comparisons. */
const passes = async (n: number, { seed, write }: Case) => {
  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: padded(n) },
  });
  try {
    await env.clearFirestore();
    if (seed) {
      await env.withSecurityRulesDisabled((context) =>
        seed(context.firestore() as unknown as Firestore).then(() => undefined),
      );
    }
    await write(env.authenticatedContext('alice').firestore() as unknown as Firestore);
    return true;
  } catch (error) {
    if (String(error).includes('maximum of 1000 expressions')) return false;
    throw error;
  } finally {
    await env.cleanup();
  }
};

/** The largest padding the case passes with (-1: it fails even without padding). */
const maxPadding = async (c: Case) => {
  if (!(await passes(0, c))) return -1;
  let low = 0; // passes
  let high = 64; // grows until it fails
  while (await passes(high, c)) {
    low = high;
    high *= 2;
  }
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (await passes(mid, c)) low = mid;
    else high = mid;
  }
  return low;
};

// The other test files load the real rules themselves; restore them anyway.
afterAll(async () => {
  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
  await env.clearFirestore();
  await env.cleanup();
});

describe('the rules’ expression budget on builds (T42)', () => {
  it.skipIf(MEASURE).each(cases)(
    '$name passes with HEADROOM padding comparisons to spare',
    async (c) => {
      expect(await passes(HEADROOM, c)).toBe(true);
    },
  );

  it.runIf(MEASURE)(
    'measures the headroom of every worst case',
    async () => {
      const rows: string[] = [];
      for (const c of cases) rows.push(`${String(await maxPadding(c)).padStart(5)}  ${c.name}`);
      console.warn(`\nLargest padding each write passes with:\n${rows.join('\n')}\n`);
    },
    300_000,
  );
});
