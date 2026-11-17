// Level bands (T79): the ranges people build at, each with its own color everywhere a level shows (lists,
// the build page, the Level filter). Contiguous, so every level has one. Pure; the colors live with the
// component (components/ui/LevelNumber.tsx), the filter presets in features/builds/filters.ts.
import { MAX_LEVEL } from './buildMath';

export type LevelBandKey = 'early' | 'mid' | 'late' | 'pvp' | 'end';

export interface LevelBand {
  key: LevelBandKey;
  /** The range in a few characters, as the filter shows it ("Up to 50", "125–150"). */
  label: string;
  /** Why people build there (docs/product.md). */
  note: string;
  minLevel: number;
  maxLevel: number;
}

export const LEVEL_BANDS: readonly LevelBand[] = [
  { key: 'early', label: 'Up to 50', note: 'Early game', minLevel: 1, maxLevel: 50 },
  { key: 'mid', label: '51–100', note: 'Mid game', minLevel: 51, maxLevel: 100 },
  { key: 'late', label: '101–124', note: 'Late game', minLevel: 101, maxLevel: 124 },
  { key: 'pvp', label: '125–150', note: 'PvP meta', minLevel: 125, maxLevel: 150 },
  { key: 'end', label: '151 and up', note: 'Endgame, NG+', minLevel: 151, maxLevel: MAX_LEVEL },
];

/** The band a level is in (below 1 counts as early, above the cap as end). */
export function levelBand(level: number): LevelBand {
  return LEVEL_BANDS.find((band) => level <= band.maxLevel) ?? LEVEL_BANDS[LEVEL_BANDS.length - 1]!;
}
