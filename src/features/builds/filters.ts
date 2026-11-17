// The builds page's filters (T74): parsed from / written to the URL
// (/builds?q=moon&sort=new&tag=Malenia&tag=Mohg&weapon=moonveil&min=50&max=150) so filtered views are
// shareable, and applied to the loaded builds (Firestore gets the level range and one array filter:
// the weapon, else the first tag).
import { tagGroups } from '@/data/core';
import { MAX_LEVEL } from '@/lib/buildMath';
import type { BuildSort } from '@/lib/firebase';
import { tagLabel, weaponBySlug } from '@/lib/hubs';
import { LEVEL_BANDS, type LevelBandKey } from '@/lib/levels';
import type { Build } from '@/lib/models';

/** The full, filterable list of builds (the home page shows shelves; T74). */
export const BUILDS_PATH = '/builds';

export interface BuildFilters {
  /** Words to search for ('' = no search). */
  search: string;
  sort: BuildSort;
  tags: string[];
  /** A weapon's slug ('' = any weapon), as in its page's URL. */
  weapon: string;
  minLevel: number;
  maxLevel: number;
}

export const DEFAULT_FILTERS: BuildFilters = {
  search: '',
  sort: 'top',
  tags: [],
  weapon: '',
  minLevel: 1,
  maxLevel: MAX_LEVEL,
};

/** A level typed by the user, pulled into 1..MAX_LEVEL (`fallback` for anything not a number). */
export function clampLevel(value: string | number, fallback: number): number {
  const level = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(level)) return fallback;
  return Math.min(MAX_LEVEL, Math.max(1, Math.round(level)));
}

const parseSort = (value: string | null): BuildSort =>
  value === 'new' || value === 'played' ? value : 'top';

export function parseFilters(params: URLSearchParams): BuildFilters {
  const minLevel = clampLevel(params.get('min') ?? '', 1);
  const maxLevel = clampLevel(params.get('max') ?? '', MAX_LEVEL);
  const weapon = params.get('weapon') ?? '';
  return {
    search: (params.get('q') ?? '').trim().slice(0, 80),
    sort: parseSort(params.get('sort')),
    tags: [...new Set(params.getAll('tag').filter(Boolean))],
    weapon: weaponBySlug(weapon) ? weapon : '',
    minLevel: Math.min(minLevel, maxLevel),
    maxLevel: Math.max(minLevel, maxLevel),
  };
}

/** The URL query for `filters`, leaving out defaults. */
export function toSearchParams(filters: BuildFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.sort !== 'top') params.set('sort', filters.sort);
  filters.tags.forEach((tag) => params.append('tag', tag));
  if (filters.weapon) params.set('weapon', filters.weapon);
  if (filters.minLevel !== 1) params.set('min', String(filters.minLevel));
  if (filters.maxLevel !== MAX_LEVEL) params.set('max', String(filters.maxLevel));
  return params;
}

/** The builds page with these filters (a home shelf's "See all"). */
export function buildsHref(filters: Partial<BuildFilters> = {}): string {
  const query = toSearchParams({ ...DEFAULT_FILTERS, ...filters }).toString();
  return query ? `${BUILDS_PATH}?${query}` : BUILDS_PATH;
}

/** The weapon filter's game ID, or undefined for any weapon. */
export const weaponIdOf = (filters: Pick<BuildFilters, 'weapon'>) =>
  filters.weapon ? weaponBySlug(filters.weapon)?.id : undefined;

/** True when anything but the sort narrows the list. */
export const isFiltered = (filters: BuildFilters) =>
  toSearchParams({ ...filters, sort: 'top' }).size > 0;

/** Builds with every tag, the weapon in any hand and a level within the range (all filters apply). */
export function filterBuilds(builds: Build[], filters: BuildFilters): Build[] {
  const weaponId = weaponIdOf(filters);
  return builds.filter(
    (build) =>
      build.level >= filters.minLevel &&
      build.level <= filters.maxLevel &&
      filters.tags.every((tag) => build.tags.includes(tag)) &&
      (weaponId === undefined || build.equipment.weapons.includes(weaponId)),
  );
}

/** `tags` with `tag` added at the end, or taken out if it's there (a top-tag toggle, T20). */
export function toggleTag(tags: string[], tag: string): string[] {
  return tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
}

// --- Level ---------------------------------------------------------------------------------------------

export interface LevelPreset {
  label: string;
  /** Why people build there, shown beside the label. */
  note?: string;
  /** The level band it is (its color), if any. */
  band?: LevelBandKey;
  minLevel: number;
  maxLevel: number;
}

/**
 * The levels people build at (docs/product.md): any, then the level bands (T79: contiguous, each with
 * its color, `lib/levels.ts`). Old links with other ranges still work as a custom range.
 */
export const LEVEL_PRESETS: readonly LevelPreset[] = [
  { label: 'Any level', minLevel: 1, maxLevel: MAX_LEVEL },
  ...LEVEL_BANDS.map(({ key, label, note, minLevel, maxLevel }) => ({
    band: key,
    label,
    note,
    minLevel,
    maxLevel,
  })),
];

/** The preset these levels are, if any. */
export const levelPreset = ({ minLevel, maxLevel }: Pick<BuildFilters, 'minLevel' | 'maxLevel'>) =>
  LEVEL_PRESETS.find((preset) => preset.minLevel === minLevel && preset.maxLevel === maxLevel);

/** The level range in a few characters: "Any", "125–150", "200+", "Up to 50". */
export function levelText({ minLevel, maxLevel }: Pick<BuildFilters, 'minLevel' | 'maxLevel'>) {
  if (minLevel === 1 && maxLevel === MAX_LEVEL) return 'Any';
  if (maxLevel === MAX_LEVEL) return `${minLevel}+`;
  if (minLevel === 1) return `Up to ${maxLevel}`;
  return minLevel === maxLevel ? String(minLevel) : `${minLevel}–${maxLevel}`;
}

// --- Active filters -----------------------------------------------------------------------------------

export interface ActiveFilter {
  key: string;
  /** What the chip says ("Level 125–150", "Bleed", "Moonveil"). */
  label: string;
  /** The change that takes this filter away. */
  without: Partial<BuildFilters>;
}

/** The filters in use, as removable chips: level, then tags, then the weapon. Search and sort aren't. */
export function activeFilters(filters: BuildFilters): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (filters.minLevel !== 1 || filters.maxLevel !== MAX_LEVEL) {
    active.push({
      key: 'level',
      label: `Level ${levelText(filters)}`,
      without: { minLevel: 1, maxLevel: MAX_LEVEL },
    });
  }
  for (const tag of filters.tags) {
    active.push({
      key: `tag:${tag}`,
      label: tagLabel(tag),
      without: { tags: filters.tags.filter((t) => t !== tag) },
    });
  }
  const weapon = filters.weapon ? weaponBySlug(filters.weapon) : undefined;
  if (weapon) active.push({ key: 'weapon', label: weapon.name, without: { weapon: '' } });
  return active;
}

// --- Top tags ------------------------------------------------------------------------------------------

const KNOWN_TAGS = new Set(Object.values(tagGroups).flat());

/**
 * The most used tags from the daily stats (T20): by build count, ties by name, at most `count`.
 * Tags no longer in the tag list (renamed or removed) and unused ones are left out.
 */
export function topTags(
  tagCounts: Record<string, number>,
  count = 10,
  known: ReadonlySet<string> = KNOWN_TAGS,
): { tag: string; count: number }[] {
  return Object.entries(tagCounts)
    .filter(([tag, n]) => n > 0 && known.has(tag))
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .slice(0, count)
    .map(([tag, n]) => ({ tag, count: n }));
}
