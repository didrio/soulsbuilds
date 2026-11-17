#!/usr/bin/env node
// Moderation from the command line (T10): review reports, remove content, manage admins. Uses the
// Admin SDK, which bypasses firestore.rules. DRY RUN by default: changes are printed, and only
// written with --write. Defaults to the local emulator; --project <id> targets a real project with
// Application Default Credentials (`gcloud auth application-default login`), never a key file.
//
//   node scripts/admin.mjs reports                        open reports, grouped by what they target
//   node scripts/admin.mjs remove <buildId> [commentId]   delete a build (with its likes and comments)
//                                                         or one comment (with the counter); resolves
//                                                         its reports as "removed"
//   node scripts/admin.mjs dismiss <buildId> [commentId]  resolve its open reports as "dismissed"
//   node scripts/admin.mjs rename <uid> <name>            change a display name (moderation, T18)
//   node scripts/admin.mjs delete-user <uid|email>        delete an account and everything it published:
//                                                         builds (with their likes and comments), likes,
//                                                         comments and comment likes elsewhere (with the
//                                                         counters),
//                                                         reports filed, profile (with its tracking,
//                                                         moving those builds' counters), Auth user;
//                                                         resolves reports about that
//                                                         content as "removed" (T18)
//   node scripts/admin.mjs grant <uid|email>              set the `admin` custom claim
//   node scripts/admin.mjs revoke <uid|email>             clear it
//   node scripts/admin.mjs stats                          count builds, authors, accounts and tags per
//                                                         game into the public doc stats/<game> (T20;
//                                                         daily in CI: .github/workflows/stats.yml)
//   node scripts/admin.mjs counts                         recount every build's playerCount and
//                                                         finishedCount from the tracking docs (T36:
//                                                         the backfill after deploying T36, and a repair)
//   node scripts/admin.mjs export                    back up every document (all collections and
//                                                         subcollections) as JSON; read-only (T12: the
//                                                         Spark plan has no managed backups or PITR)
//   ... --project soulsbuilds --write                     production (owner only), applied
//
// Moderation is delete, not hide (docs/decisions.md): before deleting, `remove` and `delete-user` save
// what they delete as JSON under .admin-backups/ (gitignored), so a mistake can be put back by hand.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DocumentReference, FieldValue, Timestamp } from 'firebase-admin/firestore';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const targetLabel = ({ buildId, commentId }) =>
  commentId ? `comment ${buildId}/${commentId}` : `build ${buildId}`;

/** Open reports grouped by target, oldest first, each with a short description of the content. */
export async function listOpenReports(db) {
  const snapshot = await db.collection('reports').where('status', '==', 'open').get();
  const groups = new Map();
  for (const report of snapshot.docs) {
    const data = report.data();
    const key = data.commentId ? `${data.buildId}/${data.commentId}` : data.buildId;
    if (!groups.has(key))
      groups.set(key, { buildId: data.buildId, commentId: data.commentId ?? null, reports: [] });
    groups.get(key).reports.push({
      id: report.id,
      reporterId: data.reporterId,
      reason: data.reason,
      note: data.note,
      createdAt: data.createdAt?.toDate() ?? null,
    });
  }
  const result = [...groups.values()];
  for (const group of result) {
    group.reports.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    group.content = await describeTarget(db, group);
  }
  return result.sort((a, b) => (a.reports[0].createdAt ?? 0) - (b.reports[0].createdAt ?? 0));
}

async function describeTarget(db, { buildId, commentId }) {
  const ref = commentId
    ? db.doc(`builds/${buildId}/comments/${commentId}`)
    : db.doc(`builds/${buildId}`);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  return commentId
    ? { authorId: data.authorId, text: data.text }
    : { authorId: data.ownerId, text: data.name };
}

/**
 * Open reports about a target. With `includeComments`, a build's target also covers reports on its
 * comments (used when the whole build is removed).
 */
async function openReportsFor(db, { buildId, commentId = null }, { includeComments = false } = {}) {
  const snapshot = await db.collection('reports').where('buildId', '==', buildId).get();
  return snapshot.docs.filter((report) => {
    const data = report.data();
    if (data.status !== 'open') return false;
    if (commentId) return data.commentId === commentId;
    return includeComments || data.commentId === null;
  });
}

async function resolveReports(db, reports, status) {
  const batch = db.batch();
  reports.forEach((report) =>
    batch.update(report.ref, { status, resolvedAt: FieldValue.serverTimestamp() }),
  );
  if (reports.length) await batch.commit();
}

const toJson = (value) =>
  JSON.stringify(
    value,
    (_key, v) => {
      if (v instanceof Timestamp) return { timestamp: v.toDate().toISOString() };
      if (v instanceof DocumentReference) return { ref: v.path };
      return v;
    },
    2,
  );

const stampNow = () => new Date().toISOString().replace(/[:.]/g, '-');

/**
 * Reads every document in the database, subcollections included, into one JSON file in `dir`:
 * `{ exportedAt, projectId, docs: { 'builds/B1': {...}, 'builds/B1/comments/c1': {...} } }`.
 * Walks `listDocuments()`, so subcollections under a missing parent doc are found too. Only reads.
 * Resolves to the file path and the document count per collection path (ids replaced by `*`).
 */
export async function exportAll(db, { dir = join(root, '.admin-backups'), projectId = null } = {}) {
  const docs = {};
  const counts = {};
  const walk = async (collections) => {
    for (const collection of collections) {
      const refs = await collection.listDocuments();
      for (let i = 0; i < refs.length; i += 300) {
        const snapshots = refs.length ? await db.getAll(...refs.slice(i, i + 300)) : [];
        for (const snapshot of snapshots) {
          if (!snapshot.exists) continue;
          docs[snapshot.ref.path] = snapshot.data();
          const key = snapshot.ref.parent.path.replace(/\/[^/]+\//g, '/*/');
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
      for (const ref of refs) await walk(await ref.listCollections());
    }
  };
  await walk(await db.listCollections());
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `export_${projectId ?? 'db'}_${stampNow()}.json`);
  writeFileSync(file, toJson({ exportedAt: new Date().toISOString(), projectId, docs }));
  return { file, counts, total: Object.keys(docs).length };
}

/**
 * Deletes a build (with its likes and comments) or a single comment (and moves the build's
 * commentCount; its likes go too, T62), and resolves the matching open reports as "removed". Writes only with `write`;
 * then saves a JSON backup in `backupDir` first. Resolves to what it found / did.
 */
export async function removeContent(
  db,
  target,
  { write = false, backupDir = join(root, '.admin-backups') } = {},
) {
  const { buildId, commentId = null } = target;
  const buildRef = db.doc(`builds/${buildId}`);
  const ref = commentId ? buildRef.collection('comments').doc(commentId) : buildRef;
  const snapshot = await ref.get();
  const reports = await openReportsFor(db, { buildId, commentId }, { includeComments: true });
  const result = { found: snapshot.exists, reports: reports.length, backup: null };
  if (!write) return result;

  if (snapshot.exists) {
    const backup = { path: ref.path, data: snapshot.data(), removedAt: new Date().toISOString() };
    const commentLikes = commentId
      ? await buildRef.collection('commentLikes').where('commentId', '==', commentId).get()
      : null;
    if (commentLikes) backup.likes = commentLikes.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!commentId) {
      const [comments, likes] = await Promise.all([
        buildRef.collection('comments').get(),
        buildRef.collection('likes').get(),
      ]);
      backup.comments = comments.docs.map((d) => ({ id: d.id, ...d.data() }));
      backup.likes = likes.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    mkdirSync(backupDir, { recursive: true });
    result.backup = join(backupDir, `${stampNow()}_${ref.path.replaceAll('/', '_')}.json`);
    writeFileSync(result.backup, toJson(backup));

    if (commentId) {
      const batch = db.batch();
      batch.delete(ref);
      if ((await buildRef.get()).exists)
        batch.update(buildRef, { commentCount: FieldValue.increment(-1) });
      await batch.commit();
      // Its likes (T62) would only be unreachable orphans; the backup keeps them.
      await commitInBatches(
        db,
        commentLikes.docs.map((like) => (likeBatch) => likeBatch.delete(like.ref)),
      );
    } else {
      await db.recursiveDelete(buildRef);
    }
  }
  await resolveReports(db, reports, 'removed');
  return result;
}

/** Resolves the open reports on a target as "dismissed" (the content stays). */
export async function dismissReports(db, target, { write = false } = {}) {
  const reports = await openReportsFor(db, target);
  if (write) await resolveReports(db, reports, 'dismissed');
  return { reports: reports.length };
}

const ignoreUserNotFound = (error) => {
  if (error?.code === 'auth/user-not-found') return null;
  throw error;
};

/** The same limit as firestore.rules (`isText(displayName, 40)`) and LIMITS.displayName. */
const DISPLAY_NAME_MAX = 40;

/**
 * Changes a user's display name (moderation): the public profile, and the Auth profile's copy if the
 * Auth user exists. The name is trimmed and must be 1–40 characters, like the rules require.
 */
export async function renameUser(db, auth, uid, name, { write = false } = {}) {
  const displayName = name.trim();
  if (!displayName || displayName.length > DISPLAY_NAME_MAX) {
    throw new Error(`A display name is 1–${DISPLAY_NAME_MAX} characters (after trimming)`);
  }
  const ref = db.doc(`users/${uid}`);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error(`No profile users/${uid}`);
  if (write) {
    await ref.update({ displayName });
    await auth.updateUser(uid, { displayName }).catch(ignoreUserNotFound);
  }
  return { uid, before: snapshot.get('displayName'), after: displayName };
}

/** Commits `ops` (functions that add one write to a batch) in batches of at most `size` writes. */
async function commitInBatches(db, ops, size = 200) {
  for (let i = 0; i < ops.length; i += size) {
    const batch = db.batch();
    ops.slice(i, i + size).forEach((op) => op(batch));
    await batch.commit();
  }
}

/**
 * Deletes an account and everything it published, like the in-app "Delete account"
 * (src/lib/firebase/account.ts) but with the Admin SDK: their builds (with every like and comment
 * on them), their likes, comments and comment likes (T62) on other builds (moving those counters), the reports they
 * filed, their profile with its tracking progress (T34; moving the tracked builds' playerCount and
 * finishedCount, T36) and their Auth user. Open reports about their builds and comments are
 * resolved as "removed". `who` is a uid or an email. Writes only with `write`; then saves a JSON
 * backup in `backupDir` first. Safe to re-run. Resolves to the counts it found.
 */
export async function deleteUserData(
  db,
  auth,
  who,
  { write = false, backupDir = join(root, '.admin-backups') } = {},
) {
  const authUser = who.includes('@')
    ? await auth.getUserByEmail(who)
    : await auth.getUser(who).catch(ignoreUserNotFound);
  const uid = authUser?.uid ?? who;
  const profileRef = db.doc(`users/${uid}`);
  const [profile, builds, likes, comments, commentLikes, filed, tracking] = await Promise.all([
    profileRef.get(),
    db.collection('builds').where('ownerId', '==', uid).get(),
    db.collectionGroup('likes').where('userId', '==', uid).get(),
    db.collectionGroup('comments').where('authorId', '==', uid).get(),
    db.collectionGroup('commentLikes').where('userId', '==', uid).get(),
    db.collection('reports').where('reporterId', '==', uid).get(),
    profileRef.collection('tracking').get(),
  ]);
  const ownIds = new Set(builds.docs.map((build) => build.id));
  const elsewhere = (snapshot) => snapshot.docs.filter((d) => !ownIds.has(d.ref.parent.parent.id));
  const likesElsewhere = elsewhere(likes);
  const commentsElsewhere = elsewhere(comments);
  const commentLikesElsewhere = elsewhere(commentLikes);

  const about = new Map();
  const addReports = (reports) =>
    reports
      .filter((report) => report.get('reporterId') !== uid)
      .forEach((report) => about.set(report.id, report));
  for (const buildId of ownIds) {
    addReports(await openReportsFor(db, { buildId }, { includeComments: true }));
  }
  for (const comment of commentsElsewhere) {
    const target = { buildId: comment.ref.parent.parent.id, commentId: comment.id };
    addReports(await openReportsFor(db, target));
  }

  const result = {
    uid,
    email: authUser?.email ?? null,
    authUser: Boolean(authUser),
    profile: profile.exists,
    builds: ownIds.size,
    likes: likesElsewhere.length,
    comments: commentsElsewhere.length,
    commentLikes: commentLikesElsewhere.length,
    reportsFiled: filed.size,
    reportsResolved: about.size,
    tracking: tracking.size,
    backup: null,
  };
  if (!write) return result;

  const docData = (d) => ({ path: d.ref.path, ...d.data() });
  const backup = {
    uid,
    email: result.email,
    removedAt: new Date().toISOString(),
    profile: profile.exists ? profile.data() : null,
    builds: await Promise.all(
      builds.docs.map(async (build) => {
        const [buildComments, buildLikes] = await Promise.all([
          build.ref.collection('comments').get(),
          build.ref.collection('likes').get(),
        ]);
        return {
          ...docData(build),
          comments: buildComments.docs.map(docData),
          likes: buildLikes.docs.map(docData),
        };
      }),
    ),
    likes: likesElsewhere.map(docData),
    comments: commentsElsewhere.map(docData),
    commentLikes: commentLikesElsewhere.map(docData),
    reports: filed.docs.map(docData),
    tracking: tracking.docs.map(docData),
  };
  mkdirSync(backupDir, { recursive: true });
  result.backup = join(backupDir, `${stampNow()}_user_${uid}.json`);
  writeFileSync(result.backup, toJson(backup));

  for (const build of builds.docs) await db.recursiveDelete(build.ref);
  const trackedBuild = (d) => db.doc(`builds/${d.id}`);
  const parents = [
    ...new Map(
      [
        ...[...likesElsewhere, ...commentsElsewhere].map((d) => d.ref.parent.parent),
        ...tracking.docs.map(trackedBuild),
      ].map((ref) => [ref.path, ref]),
    ).values(),
  ];
  const existing = new Set(
    parents.length
      ? (await db.getAll(...parents)).filter((s) => s.exists).map((s) => s.ref.path)
      : [],
  );
  const counter = (d, field) => (batch) => {
    batch.delete(d.ref);
    const build = d.ref.parent.parent;
    if (existing.has(build.path)) batch.update(build, { [field]: FieldValue.increment(-1) });
  };
  // A like or comment and its counter stay in one batch (two writes each).
  await commitInBatches(
    db,
    likesElsewhere.map((d) => counter(d, 'likeCount')),
  );
  // Comment likes (T62) before their comments (they may have liked their own), each with the
  // comment's likeCount while the comment exists.
  const likedComments = commentLikesElsewhere.map((d) =>
    d.ref.parent.parent.collection('comments').doc(d.get('commentId')),
  );
  const existingComments = new Set(
    likedComments.length
      ? (await db.getAll(...likedComments)).filter((s) => s.exists).map((s) => s.ref.path)
      : [],
  );
  await commitInBatches(
    db,
    commentLikesElsewhere.map((d, i) => (batch) => {
      batch.delete(d.ref);
      const comment = likedComments[i];
      if (existingComments.has(comment.path)) {
        batch.update(comment, { likeCount: FieldValue.increment(-1) });
      }
    }),
  );
  await commitInBatches(
    db,
    commentsElsewhere.map((d) => counter(d, 'commentCount')),
  );
  // Their progress, with the tracked builds' counters (T36).
  await commitInBatches(
    db,
    tracking.docs.map((d) => (batch) => {
      batch.delete(d.ref);
      const build = trackedBuild(d);
      if (!existing.has(build.path)) return;
      const finished = d.get('completedAt') ? -1 : 0;
      batch.update(build, {
        playerCount: FieldValue.increment(-1),
        ...(finished ? { finishedCount: FieldValue.increment(finished) } : {}),
      });
    }),
  );
  await commitInBatches(
    db,
    filed.docs.map((report) => (batch) => batch.delete(report.ref)),
  );
  await resolveReports(db, [...about.values()], 'removed');
  // The profile with its subcollection (tracking).
  await db.recursiveDelete(profileRef);
  if (authUser) await auth.deleteUser(uid).catch(ignoreUserNotFound);
  return result;
}

/** The games builds can belong to (`GameId` in src/lib/models.ts); `stats/<game>` per game. */
export const STATS_GAMES = ['elden-ring'];

/**
 * Community numbers for one game (T20): builds, distinct authors, builds per tag and per weapon (T55: the
 * landing's Popular weapons), and all accounts. One pass over the game's builds (only `tags`, `ownerId`
 * and `equipment.weapons`), plus a `count()` of users.
 */
export async function computeStats(db, game) {
  const [builds, users] = await Promise.all([
    db
      .collection('builds')
      .where('game', '==', game)
      .select('tags', 'ownerId', 'equipment.weapons')
      .get(),
    db.collection('users').count().get(),
  ]);
  const authors = new Set();
  const tagCounts = {};
  const weaponCounts = {};
  for (const build of builds.docs) {
    authors.add(build.get('ownerId'));
    for (const tag of new Set(build.get('tags') ?? [])) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    // Weapon game IDs as keys (a map's keys are strings); a build counts once per weapon.
    for (const id of new Set(build.get('equipment.weapons') ?? [])) {
      if (id !== null) weaponCounts[id] = (weaponCounts[id] ?? 0) + 1;
    }
  }
  return {
    buildCount: builds.size,
    authorCount: authors.size,
    userCount: users.data().count,
    tagCounts,
    weaponCounts,
  };
}

/**
 * Computes every game's stats and, with `write`, saves each as the public doc `stats/<game>` (read by
 * the landing page; the rules let no client write it). Run daily by .github/workflows/stats.yml and
 * by the seed. Resolves to the stats by game.
 */
export async function updateStats(db, { write = false, games = STATS_GAMES } = {}) {
  const result = {};
  for (const game of games) {
    result[game] = await computeStats(db, game);
    if (write) {
      await db
        .doc(`stats/${game}`)
        .set({ ...result[game], updatedAt: FieldValue.serverTimestamp() });
    }
  }
  return result;
}

/**
 * Recounts every build's tracking counters (T36) from the tracking docs (`users/{uid}/tracking/
 * {buildId}`): `playerCount` = docs, `finishedCount` = docs with `completedAt`. Builds from before
 * T36 have neither field until this runs (the "Most played" sort skips them). With `write`, updates
 * the builds whose counters differ. A player's change that lands mid-run can be overwritten, so run it
 * at a quiet time; a second run shows nothing left to fix. Resolves to the builds seen and the changes.
 */
export async function recountTracking(db, { write = false } = {}) {
  const [tracking, builds] = await Promise.all([
    db.collectionGroup('tracking').get(),
    db.collection('builds').select('playerCount', 'finishedCount').get(),
  ]);
  const counted = new Map();
  for (const d of tracking.docs) {
    const count = counted.get(d.id) ?? { playerCount: 0, finishedCount: 0 };
    count.playerCount += 1;
    if (d.get('completedAt')) count.finishedCount += 1;
    counted.set(d.id, count);
  }
  const changes = [];
  for (const build of builds.docs) {
    const after = counted.get(build.id) ?? { playerCount: 0, finishedCount: 0 };
    const before = {
      playerCount: build.get('playerCount') ?? null,
      finishedCount: build.get('finishedCount') ?? null,
    };
    if (before.playerCount !== after.playerCount || before.finishedCount !== after.finishedCount) {
      changes.push({ buildId: build.id, ref: build.ref, before, after });
    }
  }
  if (write) {
    await commitInBatches(
      db,
      changes.map(
        ({ ref, after }) =>
          (batch) =>
            batch.update(ref, after),
      ),
    );
  }
  return {
    builds: builds.size,
    trackingDocs: tracking.size,
    changes: changes.map(({ ref: _ref, ...change }) => change),
  };
}

/** Sets (`admin` true) or clears the admin custom claim of a user found by uid or email. */
export async function setAdmin(auth, who, admin, { write = false } = {}) {
  const user = who.includes('@') ? await auth.getUserByEmail(who) : await auth.getUser(who);
  const claims = { ...user.customClaims };
  const before = claims.admin === true;
  if (admin) claims.admin = true;
  else delete claims.admin;
  if (write && before !== admin) await auth.setCustomUserClaims(user.uid, claims);
  return { uid: user.uid, email: user.email ?? null, before, after: admin };
}

function parseArgs(argv) {
  const opts = { project: null, write: false, positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--write') opts.write = true;
    else if (argv[i] === '--project') opts.project = argv[(i += 1)];
    else if (argv[i].startsWith('--')) throw new Error(`Unknown option ${argv[i]}`);
    else opts.positional.push(argv[i]);
  }
  return opts;
}

const USAGE = `Usage: node scripts/admin.mjs <command> [args] [--project <id>] [--write]
  reports                        list open reports
  remove <buildId> [commentId]   delete the build or comment, resolve its reports
  dismiss <buildId> [commentId]  resolve its reports, keep the content
  rename <uid> <name>            change a display name (quote a name with spaces)
  delete-user <uid|email>        delete an account and everything it published
  grant <uid|email>              make a user an admin
  revoke <uid|email>             remove admin
  stats                          count builds, authors, accounts and tags into stats/<game>
  counts                         recount builds' playerCount and finishedCount from tracking
  export                        save every document as JSON in .admin-backups/ (read-only)`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const [command, ...args] = opts.positional;
  if (!command) {
    console.log(USAGE);
    return;
  }
  let projectId = opts.project;
  // With user ADC (`gcloud auth application-default login`) the Auth admin API needs a quota
  // project, or grant/revoke fail with an "adc-troubleshooting/user-creds" error.
  if (projectId) process.env.GOOGLE_CLOUD_QUOTA_PROJECT ??= projectId;
  if (!projectId) {
    const { emulators } = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
    process.env.FIRESTORE_EMULATOR_HOST ??= `${emulators.firestore.host}:${emulators.firestore.port}`;
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= `${emulators.auth.host}:${emulators.auth.port}`;
    projectId = 'demo-soulsbuilds';
  }
  const where = process.env.FIRESTORE_EMULATOR_HOST
    ? `emulator (${projectId})`
    : `PRODUCTION project ${projectId}`;

  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');
  initializeApp({ projectId });
  const db = getFirestore();
  const mode = opts.write ? 'APPLYING' : 'Dry run (no writes)';
  const dryRunNote = () => {
    if (!opts.write) console.log('\nNothing was written. Re-run with --write to apply.');
  };

  if (command === 'reports') {
    console.log(`Open reports: ${where}\n`);
    const groups = await listOpenReports(db);
    if (!groups.length) console.log('None.');
    for (const group of groups) {
      const content = group.content
        ? `by ${group.content.authorId}: "${group.content.text.slice(0, 120)}"`
        : '(already deleted)';
      console.log(`${targetLabel(group)} ${content}`);
      for (const report of group.reports) {
        const date = report.createdAt?.toISOString().slice(0, 10) ?? '?';
        const note = report.note ? `: ${report.note}` : '';
        console.log(`  ${date} ${report.reason} from ${report.reporterId}${note}`);
      }
      const args = group.commentId ? `${group.buildId} ${group.commentId}` : group.buildId;
      console.log(`  → remove ${args} | dismiss ${args}\n`);
    }
  } else if (command === 'remove' || command === 'dismiss') {
    const [buildId, commentId] = args;
    if (!buildId) throw new Error(`${command} needs a build id (and optionally a comment id)`);
    const target = { buildId, commentId: commentId ?? null };
    console.log(`${mode}: ${command} ${targetLabel(target)} on ${where}\n`);
    if (command === 'remove') {
      const result = await removeContent(db, target, { write: opts.write });
      console.log(result.found ? `Found ${targetLabel(target)}.` : 'It no longer exists.');
      console.log(`Open reports to resolve as removed: ${result.reports}`);
      if (result.backup) console.log(`Backup: ${result.backup}`);
    } else {
      const result = await dismissReports(db, target, { write: opts.write });
      console.log(`Open reports to dismiss: ${result.reports}`);
    }
    dryRunNote();
  } else if (command === 'rename') {
    const [uid, ...words] = args;
    if (!uid || !words.length) throw new Error('rename needs a uid and a name');
    const result = await renameUser(db, getAuth(), uid, words.join(' '), { write: opts.write });
    console.log(`${mode}: ${where}`);
    console.log(`${result.uid}: "${result.before}" → "${result.after}"`);
    dryRunNote();
  } else if (command === 'delete-user') {
    const [who] = args;
    if (!who) throw new Error('delete-user needs a uid or email');
    const result = await deleteUserData(db, getAuth(), who, { write: opts.write });
    console.log(`${mode}: delete user ${result.uid} (${result.email ?? 'no email'}) on ${where}\n`);
    console.log(`  Auth user: ${result.authUser ? 'yes' : 'none'}`);
    console.log(`  Profile: ${result.profile ? 'yes' : 'none'}`);
    console.log(`  Builds (with their likes and comments): ${result.builds}`);
    console.log(`  Likes on other builds: ${result.likes}`);
    console.log(`  Comments on other builds: ${result.comments}`);
    console.log(`  Comment likes on other builds: ${result.commentLikes}`);
    console.log(`  Reports they filed: ${result.reportsFiled}`);
    console.log(`  Builds they track (private progress): ${result.tracking}`);
    console.log(
      `  Open reports about their content, to resolve as removed: ${result.reportsResolved}`,
    );
    if (result.backup) console.log(`\nBackup: ${result.backup}`);
    dryRunNote();
  } else if (command === 'grant' || command === 'revoke') {
    const [who] = args;
    if (!who) throw new Error(`${command} needs a uid or email`);
    const result = await setAdmin(getAuth(), who, command === 'grant', { write: opts.write });
    console.log(`${mode}: ${where}`);
    console.log(
      `${result.uid} (${result.email ?? 'no email'}): admin ${result.before} → ${result.after}`,
    );
    console.log(
      'The user must sign out and in again (or wait up to an hour) to get the new claim.',
    );
    dryRunNote();
  } else if (command === 'stats') {
    console.log(`${mode}: community stats on ${where}\n`);
    const result = await updateStats(db, { write: opts.write });
    for (const [game, stats] of Object.entries(result)) {
      const top = Object.entries(stats.tagCounts)
        .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
        .slice(0, 10)
        .map(([tag, count]) => `${tag} ${count}`);
      console.log(`stats/${game}`);
      console.log(`  ${stats.buildCount} builds by ${stats.authorCount} authors`);
      console.log(`  ${stats.userCount} accounts`);
      console.log(`  ${Object.keys(stats.tagCounts).length} tags used; top: ${top.join(', ')}`);
      const hubs = Object.values(stats.weaponCounts).filter((count) => count >= 3).length;
      console.log(
        `  ${Object.keys(stats.weaponCounts).length} weapons used; ${hubs} in 3 or more builds`,
      );
    }
    dryRunNote();
  } else if (command === 'counts') {
    console.log(`${mode}: tracking counters on ${where}\n`);
    const result = await recountTracking(db, { write: opts.write });
    console.log(`${result.builds} builds, ${result.trackingDocs} tracking docs`);
    const show = ({ playerCount, finishedCount }) =>
      playerCount === null ? 'none' : `${playerCount} playing+finished, ${finishedCount} finished`;
    for (const change of result.changes) {
      console.log(`  ${change.buildId}: ${show(change.before)} → ${show(change.after)}`);
    }
    if (!result.changes.length) console.log('Every build is counted right.');
    dryRunNote();
  } else if (command === 'export') {
    console.log(`Export (read-only): ${where}\n`);
    const result = await exportAll(db, { projectId });
    for (const [path, count] of Object.entries(result.counts).sort()) {
      console.log(`  ${path}: ${count}`);
    }
    console.log(`\n${result.total} documents → ${result.file}`);
  } else {
    console.log(USAGE);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('✗', error.message);
    process.exit(1);
  });
}
