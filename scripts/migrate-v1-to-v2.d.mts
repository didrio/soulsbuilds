// Types for scripts/migrate-v1-to-v2.mjs (used by tests/migration/).
import type { Firestore } from 'firebase-admin/firestore';

export interface MigrationReport {
  write: boolean;
  builds: { total: number; migrated: number; alreadyV2: number };
  users: { total: number; migrated: number; alreadyV2: number };
  likes: number;
  comments: number;
  notes: string[];
  /** "category: name" → number of builds that lost that 2022 name (not in the game data). */
  dropped: Record<string, number>;
}

export function migrate(
  db: Firestore,
  options?: { write?: boolean; log?: (message: string) => void },
): Promise<MigrationReport>;
