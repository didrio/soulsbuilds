// The home page's shelves (T74), worked out from the daily search index (`stats/<game>` searchIndex): one
// document read gives every shelf its builds, which are then read by id. Pure.
import { tagLabel } from '@/lib/hubs';
import type { SearchEntry } from '@/lib/models';
import { buildsHref, topTags } from './filters';
import { compareEntries } from './search';

/** A shelf shows only with at least this many builds (no thin shelves). */
export const SHELF_MIN = 3;
/** Builds on a compact shelf. */
export const SHELF_SIZE = 4;
/** Builds on Trending. */
export const TRENDING_SIZE = 5;
/** From this many builds on, a tag on more than half of them gets no shelf. */
const BROAD_FROM = 10;

/**
 * How fast Trending forgets: a build ages one step for every this many builds posted after it. Age is
 * counted in builds, not days, so the shelf is never empty, even after a quiet year.
 */
const AGE_STEP = 10;
const GRAVITY = 1.5;

/** A build's activity: likes, players (people following it through the Guide) count double, comments half. */
const activityScore = (entry: SearchEntry) =>
  1 + entry.likeCount + 2 * entry.playerCount + 0.5 * entry.commentCount;

/**
 * Trending: activity, discounted by how many builds were posted since (newest = 0). With no activity
 * anywhere, it's simply the newest builds. Ties newest first.
 */
export function trendingIds(index: readonly SearchEntry[], size = TRENDING_SIZE): string[] {
  const newestFirst = [...index].sort(compareEntries('new'));
  return newestFirst
    .map((entry, rank) => ({
      entry,
      score: activityScore(entry) / (1 + rank / AGE_STEP) ** GRAVITY,
    }))
    .sort((a, b) => b.score - a.score || b.entry.createdAt - a.entry.createdAt)
    .slice(0, size)
    .map(({ entry }) => entry.id);
}

export interface Shelf {
  key: string;
  title: string;
  caption: string;
  /** The builds page showing the whole list ("See all"). */
  href: string;
  ids: string[];
}

/**
 * The Top shelves (T74; T79: the home page's 2×2 grid with Fresh builds): Top builds for the most used
 * tags, each only with `SHELF_MIN` builds or more. A tag on most builds ("PVE") isn't a category, so it
 * gets no shelf once there are enough builds (owner's call, T79).
 */
export function tagShelves(
  index: readonly SearchEntry[],
  tagCounts: Record<string, number>,
  count = 3,
): Shelf[] {
  const broad = (n: number) => index.length >= BROAD_FROM && n > index.length / 2;
  const candidates = topTags(tagCounts, 20).filter(({ count: n }) => !broad(n));
  return candidates.slice(0, count).flatMap(({ tag }): Shelf[] => {
    const withTag = index.filter((entry) => entry.tags.includes(tag)).sort(compareEntries('top'));
    if (withTag.length < SHELF_MIN) return [];
    return [
      {
        key: `tag:${tag}`,
        title: `Top ${tagLabel(tag)} builds`,
        caption: `${withTag.length} builds`,
        href: buildsHref({ tags: [tag] }),
        ids: withTag.slice(0, SHELF_SIZE).map((entry) => entry.id),
      },
    ];
  });
}

/**
 * The compact shelves in page order (T79): the Top tag shelves, then Fresh builds (from Firestore, so a
 * new build shows at once). An even number when there are several (two across on desktop): the last
 * tag shelf goes if the count is odd.
 */
export function arrangeShelves(tags: Shelf[], fresh: Shelf | null): Shelf[] {
  const shelves = [...tags, fresh].filter((shelf): shelf is Shelf => shelf !== null);
  if (shelves.length > 1 && shelves.length % 2 === 1 && tags.length) {
    const last = tags.at(-1);
    return shelves.filter((shelf) => shelf !== last);
  }
  return shelves;
}
