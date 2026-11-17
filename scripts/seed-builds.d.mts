// Types for scripts/seed-builds.mjs (used by tests/admin/).
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Seed, SeedCheck } from './lib/seed-content.mjs';

export const LOCAL_OWNER: { uid: string; email: string };

export function resolveOwner(
  db: Firestore,
  auth: Auth,
  who: string | null,
  options?: { emulator?: boolean; write?: boolean },
): Promise<{ uid: string; displayName: string; created: boolean }>;

export interface SeedResult {
  id: string;
  file: string;
  action: 'create' | 'update' | 'unchanged' | 'refused';
  /** The content fields that differ from the stored build (for an update). */
  changed: string[];
  /** Where the stored build was saved before an update. */
  backup: string | null;
}

export function seedBuilds(
  db: Firestore,
  checked: (SeedCheck & { file: string; seed: Seed })[],
  options: { ownerId: string; write?: boolean; backupDir?: string },
): Promise<SeedResult[]>;
