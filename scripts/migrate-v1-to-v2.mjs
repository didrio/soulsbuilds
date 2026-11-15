#!/usr/bin/env node
// Migrates Firestore from data model v1 (2022) to v2 (T3; docs/architecture.md). DRY RUN by default:
// it prints what it would change and writes nothing unless you pass --write.
//
//   node scripts/migrate-v1-to-v2.mjs                         dry run, local emulator (demo-soulsbuilds)
//   node scripts/migrate-v1-to-v2.mjs --write                 apply, local emulator
//   node scripts/migrate-v1-to-v2.mjs --project soulsbuilds   dry run, PRODUCTION (owner only, T12)
//
// Production uses Application Default Credentials (`gcloud auth application-default login`), never
// a key file. Idempotent: documents already in v2 shape are skipped, and each build is written with
// its likes and comments first and the build doc last, so re-running after a failure finishes the job.
//
// What it does:
//   builds/{id}  v1 fields → v2 (ownerId, game, numeric stats, `equipment` map, counts, timestamps
//                from the document's own create/update time); comments[] → comments subcollection;
//                users' likedBuilds[] → likes subcollection; likeCount/commentCount = docs written.
//                Items: 2022 names → game IDs (scripts/lib/names-to-ids.mjs, T13), dropping names the
//                game data doesn't have and Ash/affinity/talisman combos the game doesn't allow;
//                tag "Warhammer" → "Great Hammer". Every drop is a note; the summary counts them.
//   users/{uid}  { name, email, admin, builds, likedBuilds } → { displayName, createdAt }. Emails
//                stay in Firebase Auth; v1 `admin: true` users are listed (admin is a custom claim now).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Timestamp } from 'firebase-admin/firestore';
import { buildContent, GAME, toCommentText, toDisplayName } from './lib/model-v2.mjs';
import { equipmentToIds, loadGameData, renameTags } from './lib/names-to-ids.mjs';

const BATCH_LIMIT = 450;

const isV1Build = (data) => typeof data.user === 'string' && data.ownerId === undefined;
const isV1User = (data) => data.displayName === undefined;

/**
 * v1 build doc → v2 content fields, items as game IDs (see buildContent for how odd values are
 * cleaned up, equipmentToIds for the items).
 */
function v1BuildContent(data, game, hooks) {
  return buildContent({
    name: data.name,
    description: data.description,
    tags: renameTags(data.tags, hooks.note),
    stats: data,
    equipment: equipmentToIds(
      {
        weapons: data.weapons,
        weaponAffinities: data.weaponAffinities,
        weaponSkills: data.weaponSkills,
        arrows: data.arrows,
        talismans: data.tals,
        spells: data.spells,
        tears: data.tears,
        consumables: data.cons,
        helm: data.helm,
        chest: data.chest,
        gauntlet: data.gauntlet,
        leg: data.leg,
      },
      game,
      hooks,
    ),
  });
}

/** v1 comments array → comment docs with deterministic ids (empty comments are dropped). */
function v1Comments(data, fallbackTime) {
  const comments = Array.isArray(data.comments) ? data.comments : [];
  return comments.flatMap((comment, index) => {
    const text = toCommentText(comment?.comment);
    if (!text || typeof comment.user !== 'string') return [];
    const createdAt = Number.isFinite(comment.date)
      ? Timestamp.fromMillis(comment.date)
      : fallbackTime;
    return [{ id: `v1-${index}`, doc: { authorId: comment.user, text, createdAt } }];
  });
}

async function commitInChunks(db, ops) {
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    ops.slice(i, i + BATCH_LIMIT).forEach(([ref, data]) => batch.set(ref, data));
    await batch.commit();
  }
}

/**
 * Runs the migration against an Admin SDK Firestore instance. Writes only when `write` is true.
 * Resolves to a report: counts plus `notes` (anything changed or dropped on the way).
 */
export async function migrate(db, { write = false, log = () => {} } = {}) {
  const report = {
    write,
    builds: { total: 0, migrated: 0, alreadyV2: 0 },
    users: { total: 0, migrated: 0, alreadyV2: 0 },
    likes: 0,
    comments: 0,
    notes: [],
    /** "category: name" → how many builds lost it (names the game data doesn't have). */
    dropped: {},
  };
  const note = (message) => {
    report.notes.push(message);
    log(`  · ${message}`);
  };

  const game = loadGameData();
  const [userSnap, buildSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('builds').get(),
  ]);
  report.users.total = userSnap.size;
  report.builds.total = buildSnap.size;

  // Who liked what, from the v1 users' likedBuilds arrays.
  const buildIds = new Set(buildSnap.docs.map((d) => d.id));
  const likersByBuild = new Map();
  for (const userDoc of userSnap.docs) {
    const data = userDoc.data();
    if (!isV1User(data)) continue;
    for (const buildId of new Set(Array.isArray(data.likedBuilds) ? data.likedBuilds : [])) {
      if (!buildIds.has(buildId)) {
        note(`user ${userDoc.id}: dropped like of missing build ${buildId}`);
        continue;
      }
      if (!likersByBuild.has(buildId)) likersByBuild.set(buildId, []);
      likersByBuild.get(buildId).push(userDoc.id);
    }
  }

  for (const buildDoc of buildSnap.docs) {
    const data = buildDoc.data();
    if (!isV1Build(data)) {
      report.builds.alreadyV2 += 1;
      continue;
    }
    const ref = buildDoc.ref;
    const content = v1BuildContent(data, game, {
      note: (message) => note(`build ${buildDoc.id}: ${message}`),
      dropped: (category, name) => {
        const key = `${category}: ${name}`;
        report.dropped[key] = (report.dropped[key] ?? 0) + 1;
      },
    });
    const likers = likersByBuild.get(buildDoc.id) ?? [];
    const comments = v1Comments(data, buildDoc.createTime);

    if (content.name !== data.name)
      note(`build ${buildDoc.id}: name "${data.name ?? ''}" → "${content.name}"`);
    if (String(content.level) !== String(data.level))
      note(`build ${buildDoc.id}: level ${data.level} → ${content.level} (stats cleaned up)`);
    if (Number(data.likes ?? 0) !== likers.length)
      note(
        `build ${buildDoc.id}: likeCount ${data.likes ?? 0} → ${likers.length} (counted from users' likes)`,
      );
    const v1CommentCount = Array.isArray(data.comments) ? data.comments.length : 0;
    if (v1CommentCount !== comments.length)
      note(
        `build ${buildDoc.id}: dropped ${v1CommentCount - comments.length} empty/invalid comment(s)`,
      );

    const ops = [
      ...likers.map((uid) => [
        ref.collection('likes').doc(uid),
        { userId: uid, createdAt: buildDoc.updateTime },
      ]),
      ...comments.map(({ id, doc }) => [ref.collection('comments').doc(id), doc]),
      // Last: once the build doc is v2, a re-run skips it, so its children must already be written.
      [
        ref,
        {
          ...content,
          ownerId: data.user,
          game: GAME,
          likeCount: likers.length,
          commentCount: comments.length,
          ...(comments.length ? { lastCommentId: comments.at(-1).id } : {}),
          createdAt: buildDoc.createTime,
          updatedAt: buildDoc.updateTime,
        },
      ],
    ];
    log(
      `build ${buildDoc.id} "${content.name}": ${likers.length} like(s), ${comments.length} comment(s)`,
    );
    if (write) await commitInChunks(db, ops);
    report.builds.migrated += 1;
    report.likes += likers.length;
    report.comments += comments.length;
  }

  // Users last: their likedBuilds feed the builds above.
  for (const userDoc of userSnap.docs) {
    const data = userDoc.data();
    if (!isV1User(data)) {
      report.users.alreadyV2 += 1;
      continue;
    }
    const displayName = toDisplayName(data.name);
    if (displayName !== data.name)
      note(`user ${userDoc.id}: name "${data.name ?? ''}" → "${displayName}"`);
    if (data.admin === true)
      note(`user ${userDoc.id}: was admin in v1; set the custom claim if still wanted`);
    log(`user ${userDoc.id} "${displayName}"`);
    if (write) await userDoc.ref.set({ displayName, createdAt: userDoc.createTime });
    report.users.migrated += 1;
  }

  return report;
}

function parseArgs(argv) {
  const opts = { project: null, write: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--write') opts.write = true;
    else if (argv[i] === '--project') opts.project = argv[(i += 1)];
    else throw new Error(`Unknown option ${argv[i]} (use --project <id> and/or --write)`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  let projectId = opts.project;
  if (!projectId) {
    // Default: the local emulator.
    const { firestore } = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8')).emulators;
    process.env.FIRESTORE_EMULATOR_HOST ??= `${firestore.host}:${firestore.port}`;
    projectId = 'demo-soulsbuilds';
  }
  const target = process.env.FIRESTORE_EMULATOR_HOST
    ? `emulator ${process.env.FIRESTORE_EMULATOR_HOST} (${projectId})`
    : `PRODUCTION project ${projectId} (Application Default Credentials)`;
  console.log(`${opts.write ? 'MIGRATING' : 'Dry run (no writes)'}: ${target}\n`);

  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  initializeApp({ projectId });
  const report = await migrate(getFirestore(), { write: opts.write, log: console.log });

  console.log(`
Builds: ${report.builds.migrated} to migrate, ${report.builds.alreadyV2} already v2 (of ${report.builds.total})
Users:  ${report.users.migrated} to migrate, ${report.users.alreadyV2} already v2 (of ${report.users.total})
Likes:  ${report.likes} like docs, comments: ${report.comments} comment docs
Notes:  ${report.notes.length}`);
  const dropped = Object.entries(report.dropped).sort(([, a], [, b]) => b - a);
  if (dropped.length) {
    console.log('\nNames not in the game data (dropped), by number of builds:');
    for (const [name, count] of dropped) console.log(`  ${count}× ${name}`);
  }
  if (!opts.write) console.log('\nNothing was written. Re-run with --write to apply.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  });
}
