// Types for scripts/lib/seed-content.mjs (used by tests).
import type { BuildContent, Equipment } from '../../src/lib/models';
import type { ItemData } from './build-from-names.mjs';

export const SEED_DIR: string;
export const SITE_AUTHOR: string;

export interface SeedSource {
  author?: string | null;
  site: string;
  title: string;
  url: string;
  /** What Souls Builds filled in where the source left gaps ("stats", "armor"). */
  filled?: string[];
  /** Where and when the author allowed using their own write-up. */
  permission?: string | null;
}

/** A seed file (content/builds/er/<slug>.json), loosely: the checks report anything malformed. */
export type Seed = { id: string; name: string; level: number; source: SeedSource } & Record<
  string,
  unknown
>;

export interface SeedEntry {
  file: string;
  seed: Seed;
  /** The <slug>.md write-up, or null when the file is missing. */
  writeUp: string | null;
}

export interface SeedSummary {
  className: string;
  right: string[];
  left: string[];
  talismans: string[];
  spells: string[];
  memory: string;
  armor: string[];
  vitals: { hp: number; fp: number; stamina: number; equipLoad: number };
  weight: number;
  roll: 'light' | 'medium' | 'heavy' | 'overloaded';
  poise: number;
  searchDescription?: string;
}

/** The build fields a seed writes: BuildContent with `nameLower`. */
export type SeedContent = BuildContent & { nameLower: string; equipment: Equipment };

export interface SeedCheck {
  errors: string[];
  notes: string[];
  content: SeedContent | null;
  summary: SeedSummary | null;
}

export function creditLine(source: SeedSource): string;
export function withCredit(writeUp: string, source: SeedSource): string;
export function readSeeds(dir?: string): SeedEntry[];
export function checkSeed(entry: SeedEntry, data?: ItemData): SeedCheck;
export function checkSeeds(
  seeds?: SeedEntry[],
  data?: ItemData,
): (SeedCheck & { file: string; seed: Seed })[];
