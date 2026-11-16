// stats/{game}: community numbers (builds, authors, builds per tag), written daily by
// `scripts/admin.mjs stats`. Read-only for the app (T20).
import { doc, getDoc } from 'firebase/firestore';
import type { GameId, GameStats, StatsDoc } from '@/lib/models';
import { firestore } from './app';

/** A game's community stats, or null before the daily job (or the seed) has written them. */
export async function getGameStats(game: GameId): Promise<GameStats | null> {
  const snapshot = await getDoc(doc(firestore, 'stats', game));
  if (!snapshot.exists()) return null;
  // Shape guaranteed by the writer (scripts/admin.mjs updateStats); clients can't write it.
  const data = snapshot.data({ serverTimestamps: 'estimate' }) as StatsDoc;
  return { ...data, updatedAt: data.updatedAt.toDate() };
}
