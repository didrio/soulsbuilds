// Link previews (T37) and crawlable build pages (T50): one HTTPS function behind Hosting rewrites
// (firebase.json). docs/architecture.md "Link previews". Reads builds with the Admin SDK (builds are
// public anyway); never writes.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type Query, type Timestamp } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/https';
import { GAME_ELDEN_RING, type BuildDoc } from '@/lib/models';
import type { CardData } from './card';
import { handle, type Deps } from './handler';
import type { HubBuild } from './hub';

/**
 * The card renderer loads on the first image request only: satori, resvg and sharp would add to the cold
 * start of every page and sitemap request (T50).
 */
const renderCard = async (card: CardData) => (await import('./card')).renderCard(card);

initializeApp();
const db = getFirestore();

/** A hub page's builds: only what it lists. */
async function hubBuilds(query: Query): Promise<HubBuild[]> {
  const snap = await query.select('name', 'level', 'likeCount').get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    name: (doc.get('name') as string | undefined) ?? '',
    level: (doc.get('level') as number | undefined) ?? 1,
    likeCount: (doc.get('likeCount') as number | undefined) ?? 0,
  }));
}

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
      // Only the fields the sitemap needs (a field mask; each document is still one read). Tags and
      // weapons count the hub pages (T55).
      listBuilds: async () => {
        const snap = await db
          .collection('builds')
          .select('name', 'updatedAt', 'tags', 'equipment.weapons')
          .get();
        return snap.docs.map((doc) => ({
          id: doc.id,
          name: (doc.get('name') as string | undefined) ?? '',
          updatedAt: (doc.get('updatedAt') as Timestamp | undefined)?.toDate(),
          tags: (doc.get('tags') as string[] | undefined) ?? [],
          weapons: (doc.get('equipment.weapons') as (number | null)[] | undefined) ?? [],
        }));
      },
      // The app's queries (src/lib/firebase/builds.ts), with the same indexes.
      listWeaponBuilds: async (weaponId, limit) =>
        hubBuilds(
          db
            .collection('builds')
            .where('game', '==', GAME_ELDEN_RING)
            .where('equipment.weapons', 'array-contains', weaponId)
            .orderBy('likeCount', 'desc')
            .limit(limit),
        ),
      listTagBuilds: async (tag, limit) =>
        hubBuilds(
          db
            .collection('builds')
            .where('game', '==', GAME_ELDEN_RING)
            .where('tags', 'array-contains', tag)
            .orderBy('likeCount', 'desc')
            .limit(limit),
        ),
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
