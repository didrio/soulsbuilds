#!/usr/bin/env node
// Seeded builds (T52): writes the builds in content/builds/er/ as the "Souls Builds" account, each crediting the
// community build it recreates. Every seed is checked first (scripts/lib/seed-content.mjs; the Admin SDK skips
// firestore.rules, so those checks are the gate), and nothing is written while any seed has an error.
// DRY RUN by default: prints each build and what would happen. Idempotent: the doc ID comes from the seed
// file, so a re-run updates the build's content (counters, likes, comments and createdAt stay) or skips
// it when nothing changed; a doc with that ID owned by anyone else is refused. Defaults to the local
// emulator (creating a local "Souls Builds" user); --project <id> targets a real project with
// Application Default Credentials, never a key file, and needs --owner.
//
//   node scripts/seed-builds.mjs                          check every seed, dry run on the emulator
//   node scripts/seed-builds.mjs --write                  write them to the emulator
//   node scripts/seed-builds.mjs --only <file|id>         just one seed
//   ... --project soulsbuilds --owner <uid|email>         production (owner only; `admin.mjs export` first)
//
// Before an existing build is updated, its current document is saved under .admin-backups/ (gitignored).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { updateStats } from './admin.mjs';
import { GAME } from './lib/model-v2.mjs';
import { checkSeeds, readSeeds, SEED_DIR, SITE_AUTHOR } from './lib/seed-content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The emulator's stand-in for the production "Souls Builds" account. */
export const LOCAL_OWNER = { uid: 'seed-soulsbuilds', email: 'soulsbuilds@example.test' };

/** The fields a seed owns on its build; everything else (counters, createdAt) is the site's. */
const CONTENT_FIELDS = [
  'name',
  'nameLower',
  'description',
  'tags',
  'level',
  'stats',
  'equipment',
  'startingClass',
  'image',
];

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const stampNow = () => new Date().toISOString().replace(/[:.]/g, '-');

const toJson = (value) =>
  JSON.stringify(
    value,
    (_key, v) => (v instanceof Timestamp ? { timestamp: v.toDate().toISOString() } : v),
    2,
  );

/**
 * The seed owner's uid and display name. `who` is a uid or an email; without it, only on the emulator,
 * the local "Souls Builds" user (created with `write`). The account must have a public profile: that's
 * the byline on every seeded build.
 */
export async function resolveOwner(db, auth, who, { emulator = false, write = false } = {}) {
  if (!who) {
    if (!emulator) throw new Error('--owner <uid|email> is required outside the emulator');
    const profile = await db.doc(`users/${LOCAL_OWNER.uid}`).get();
    if (!profile.exists && write) {
      await auth.createUser({ ...LOCAL_OWNER, displayName: SITE_AUTHOR }).catch((error) => {
        if (error.code !== 'auth/uid-already-exists') throw error;
      });
      await db
        .doc(`users/${LOCAL_OWNER.uid}`)
        .set({ displayName: SITE_AUTHOR, createdAt: FieldValue.serverTimestamp() });
    }
    return { uid: LOCAL_OWNER.uid, displayName: SITE_AUTHOR, created: !profile.exists };
  }
  const user = who.includes('@') ? await auth.getUserByEmail(who) : await auth.getUser(who);
  const profile = await db.doc(`users/${user.uid}`).get();
  if (!profile.exists)
    throw new Error(
      `${who} has no profile yet: sign in on the site once and pick the display name`,
    );
  return { uid: user.uid, displayName: profile.get('displayName'), created: false };
}

/**
 * Writes checked seeds (from checkSeeds, all without errors) as `ownerId`'s builds. Resolves to one result per
 * seed: { id, file, action: 'create' | 'update' | 'unchanged' | 'refused', changed, backup }. Reads every
 * build first: if any ID is refused (someone else's build), nothing is written. With `write` false nothing
 * is written either.
 */
export async function seedBuilds(
  db,
  checked,
  { ownerId, write = false, backupDir = join(root, '.admin-backups') } = {},
) {
  const plans = [];
  for (const { file, seed, content } of checked) {
    const ref = db.doc(`builds/${seed.id}`);
    const snapshot = await ref.get();
    const result = { id: seed.id, file, action: 'create', changed: [], backup: null };
    const current = snapshot.exists ? snapshot.data() : null;
    if (current && (current.ownerId !== ownerId || current.game !== GAME))
      result.action = 'refused';
    else if (current) {
      result.changed = CONTENT_FIELDS.filter((field) => !same(current[field], content[field]));
      result.action = result.changed.length ? 'update' : 'unchanged';
    }
    plans.push({ ref, content, current, result });
  }
  if (!write || plans.some(({ result }) => result.action === 'refused'))
    return plans.map(({ result }) => result);

  for (const { ref, content, current, result } of plans) {
    if (result.action === 'create') {
      await ref.set({
        ...content,
        ownerId,
        game: GAME,
        likeCount: 0,
        commentCount: 0,
        playerCount: 0,
        finishedCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (result.action === 'update') {
      mkdirSync(backupDir, { recursive: true });
      result.backup = join(backupDir, `${stampNow()}_seed_${result.id}.json`);
      writeFileSync(result.backup, toJson({ [`builds/${result.id}`]: current }));
      await ref.update({ ...content, updatedAt: FieldValue.serverTimestamp() });
    }
  }
  return plans.map(({ result }) => result);
}

function parseArgs(argv) {
  const opts = { project: null, owner: null, only: null, write: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--write') opts.write = true;
    else if (argv[i] === '--project') opts.project = argv[(i += 1)];
    else if (argv[i] === '--owner') opts.owner = argv[(i += 1)];
    else if (argv[i] === '--only') opts.only = argv[(i += 1)];
    else throw new Error(`Unknown option ${argv[i]}`);
  }
  return opts;
}

/** One seed's report: the build, its numbers, what to look at, and its errors. */
function printSeed({ file, seed, errors, notes, summary }) {
  console.log(`${errors.length ? '✗' : '✓'} ${file}  "${seed.name}"  level ${seed.level}`);
  if (summary) {
    const line = (label, items) =>
      items.length && console.log(`    ${label}: ${items.join(' · ')}`);
    console.log(`    ${summary.className} · ${(seed.tags ?? []).join(', ')}`);
    line('Right hand', summary.right);
    line('Left hand', summary.left);
    line('Talismans', summary.talismans);
    line('Spells', summary.spells.length ? [...summary.spells, `memory ${summary.memory}`] : []);
    line('Armor', summary.armor);
    const v = summary.vitals;
    console.log(
      `    HP ${v.hp} · FP ${v.fp} · Stamina ${v.stamina} · Load ${summary.weight}/${v.equipLoad} ${summary.roll} roll · Poise ${summary.poise}`,
    );
    if (summary.searchDescription) console.log(`    Search: ${summary.searchDescription}`);
  }
  notes.forEach((note) => console.log(`    note: ${note}`));
  errors.forEach((error) => console.log(`    error: ${error}`));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  let projectId = opts.project;
  if (projectId) process.env.GOOGLE_CLOUD_QUOTA_PROJECT ??= projectId;
  if (!projectId) {
    const { emulators } = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
    process.env.FIRESTORE_EMULATOR_HOST ??= `${emulators.firestore.host}:${emulators.firestore.port}`;
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= `${emulators.auth.host}:${emulators.auth.port}`;
    projectId = 'demo-soulsbuilds';
  }
  const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  const where = emulator ? `emulator (${projectId})` : `PRODUCTION project ${projectId}`;

  let seeds = readSeeds();
  if (opts.only)
    seeds = seeds.filter(({ file, seed }) => file === opts.only || seed.id === opts.only);
  if (!seeds.length) throw new Error(`no seed matches ${opts.only ?? `in ${SEED_DIR}`}`);
  const checked = checkSeeds(seeds);
  const ids = new Map();
  for (const { file, seed, errors } of checked) {
    if (ids.has(seed.id)) errors.push(`id ${seed.id} is also used by ${ids.get(seed.id)}`);
    ids.set(seed.id, file);
  }

  console.log(
    `${opts.write ? 'APPLYING' : 'Dry run (no writes)'}: ${checked.length} seeds → ${where}\n`,
  );
  checked.forEach((entry) => {
    printSeed(entry);
    console.log('');
  });
  const broken = checked.filter(({ errors }) => errors.length);
  if (broken.length) {
    console.log(`✗ ${broken.length} seed(s) with errors; nothing was written.`);
    process.exitCode = 1;
    return;
  }

  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');
  initializeApp({ projectId });
  const db = getFirestore();
  const owner = await resolveOwner(db, getAuth(), opts.owner, { emulator, write: opts.write });
  console.log(
    `Owner: ${owner.displayName} (${owner.uid})${owner.created ? (opts.write ? ', created' : ', to be created') : ''}`,
  );
  if (owner.displayName !== SITE_AUTHOR)
    console.log(
      `  note: the display name isn't "${SITE_AUTHOR}"; every byline will say "${owner.displayName}"`,
    );

  const results = await seedBuilds(db, checked, { ownerId: owner.uid, write: opts.write });
  for (const result of results) {
    const changed = result.action === 'update' ? `: ${result.changed.join(', ')}` : '';
    console.log(`  ${result.action.padEnd(9)} ${result.id}  ${result.file}${changed}`);
    if (result.backup) console.log(`            backup: ${result.backup}`);
  }
  const refused = results.filter(({ action }) => action === 'refused');
  if (refused.length) {
    console.log(
      `\n✗ ${refused.length} ID(s) belong to someone else's build: change those seeds' ids. Nothing was written.`,
    );
    process.exitCode = 1;
  }
  if (
    opts.write &&
    !refused.length &&
    results.some(({ action }) => action === 'create' || action === 'update')
  )
    await updateStats(db, { write: true });
  if (!opts.write) console.log('\nNothing was written. Re-run with --write to apply.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('✗', error.message);
    process.exit(1);
  });
}
