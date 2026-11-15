// Landing page filters: parsed from / written to the URL
// (?q=moon&sort=new&tag=Malenia&tag=Mohg&min=50&max=150) so filtered views are shareable, and
// applied to the loaded builds.
import { MAX_LEVEL } from '@/lib/buildMath';
import type { BuildSort } from '@/lib/firebase';
import type { Build } from '@/lib/models';

export interface BuildFilters {
  /** Build name prefix ('' = no search). */
  search: string;
  sort: BuildSort;
  tags: string[];
  minLevel: number;
  maxLevel: number;
}

export const DEFAULT_FILTERS: BuildFilters = {
  search: '',
  sort: 'top',
  tags: [],
  minLevel: 1,
  maxLevel: MAX_LEVEL,
};

/** A level typed by the user, pulled into 1..MAX_LEVEL (`fallback` for anything not a number). */
export function clampLevel(value: string | number, fallback: number): number {
  const level = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(level)) return fallback;
  return Math.min(MAX_LEVEL, Math.max(1, Math.round(level)));
}

export function parseFilters(params: URLSearchParams): BuildFilters {
  const minLevel = clampLevel(params.get('min') ?? '', 1);
  const maxLevel = clampLevel(params.get('max') ?? '', MAX_LEVEL);
  return {
    search: (params.get('q') ?? '').trim().slice(0, 80),
    sort: params.get('sort') === 'new' ? 'new' : 'top',
    tags: [...new Set(params.getAll('tag').filter(Boolean))],
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
  if (filters.minLevel !== 1) params.set('min', String(filters.minLevel));
  if (filters.maxLevel !== MAX_LEVEL) params.set('max', String(filters.maxLevel));
  return params;
}

/** Builds with every tag in `tags` and a level within the range (both filters apply). */
export function filterBuilds(builds: Build[], { tags, minLevel, maxLevel }: BuildFilters): Build[] {
  return builds.filter(
    (build) =>
      build.level >= minLevel &&
      build.level <= maxLevel &&
      tags.every((tag) => build.tags.includes(tag)),
  );
}
