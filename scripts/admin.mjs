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
//   node scripts/admin.mjs grant <uid|email>              set the `admin` custom claim
//   node scripts/admin.mjs revoke <uid|email>             clear it
//   node scripts/admin.mjs export                         back up every document (all collections and
//                                                         subcollections) as JSON; read-only (T12: the
//                                                         Spark plan has no managed backups or PITR)
//   ... --project soulsbuilds --write                     production (owner only), applied
//
// Moderation is delete, not hide (docs/decisions.md): before deleting, `remove` saves what it deletes
// as JSON under .admin-backups/ (gitignored), so a mistake can be put back by hand.
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
 * commentCount), and resolves the matching open reports as "removed". Writes only with `write`;
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
  grant <uid|email>              make a user an admin
  revoke <uid|email>             remove admin
  export                         save every document as JSON in .admin-backups/ (read-only)`;

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
