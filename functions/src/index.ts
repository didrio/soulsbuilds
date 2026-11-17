// Link previews (T37) and crawlable build pages (T50): one HTTPS function behind Hosting rewrites
// (firebase.json). docs/architecture.md "Link previews". Reads builds with the Admin SDK (builds are
// public anyway); never writes.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/https';
import type { BuildDoc } from '@/lib/models';
import type { CardData } from './card';
import { handle, type Deps } from './handler';

/**
 * The card renderer loads on the first image request only: satori, resvg and sharp would add to the cold
 * start of every page and sitemap request (T50).
 */
const renderCard = async (card: CardData) => (await import('./card')).renderCard(card);

initializeApp();
const db = getFirestore();

/** Hosts whose files the function may fetch: ours, preview channels, and the local emulator. */
const HOSTS =
  /^(soulsbuilds\.com|soulsbuilds\.web\.app|soulsbuilds--[a-z0-9-]+\.web\.app|127\.0\.0\.1:\d+|localhost:\d+)$/;

function staticOrigin(host: string | undefined, proto: string | undefined): string {
  if (host && HOSTS.test(host)) {
    return `${/^(127|localhost)/.test(host) ? 'http' : (proto ?? 'https')}://${host}`;
  }
  return 'https://soulsbuilds.web.app';
}

export const site = onRequest(
  { region: 'us-central1', memory: '512MiB', maxInstances: 5, timeoutSeconds: 30, cors: false },
  async (req, res) => {
    const forwardedHost = req.headers['x-forwarded-host'];
    const host =
      typeof forwardedHost === 'string' ? forwardedHost.split(',')[0]!.trim() : req.headers.host;
    const forwardedProto = req.headers['x-forwarded-proto'];
    const origin = staticOrigin(
      host,
      typeof forwardedProto === 'string' ? forwardedProto.split(',')[0] : undefined,
    );
    const deps: Deps = {
      // Firestore data is cast to the app's type, as in src/lib/firebase/builds.ts.
      loadBuild: async (id) => {
        const snap = await db.doc(`builds/${id}`).get();
        return snap.exists ? (snap.data() as BuildDoc) : null;
      },
      loadAuthor: async (uid) => {
        const snap = await db.doc(`users/${uid}`).get();
        return (snap.get('displayName') as string | undefined) ?? '';
      },
      // Only the field the sitemap needs (a field mask; each document is still one read).
      listBuilds: async () => {
        const snap = await db.collection('builds').select('updatedAt').get();
        return snap.docs.map((doc) => ({
          id: doc.id,
          updatedAt: (doc.get('updatedAt') as Timestamp | undefined)?.toDate(),
        }));
      },
      fetchStatic: async (path) => {
        const response = await fetch(`${origin}${path}`);
        return response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
      },
      renderCard,
    };
    const reply = await handle(req.path, deps);
    res.status(reply.status).set(reply.headers).send(Buffer.from(reply.body));
  },
);
