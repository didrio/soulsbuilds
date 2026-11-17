// Server data for build lists (TanStack Query over src/lib/firebase).
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCurrentGame } from '@/app/game';
import {
  getBuildsByIds,
  getGameStats,
  listBuilds,
  listUserBuilds,
  searchBuilds,
  type BuildCursor,
  type BuildSort,
} from '@/lib/firebase';
import type { Build, GameStats } from '@/lib/models';
import { queryKeys } from '@/lib/queryKeys';
import { filterBuilds, type BuildFilters } from './filters';
import { searchIds } from './search';

export const BUILDS_PAGE_SIZE = 24;

/**
 * Elden Ring builds a page at a time (`fetchNextPage`), filtered in Firestore: most liked, newest or
 * most played first, optionally one tag or one weapon, and a level range.
 */
export function useBuilds({
  sort,
  tag,
  weaponId,
  minLevel,
  maxLevel,
  enabled = true,
}: {
  sort: BuildSort;
  tag?: string;
  weaponId?: number;
  minLevel?: number;
  maxLevel?: number;
  /** False while the page shows something else (a search). */
  enabled?: boolean;
}) {
  const filters = {
    sort,
    tag: weaponId === undefined ? tag : undefined,
    weaponId,
    minLevel,
    maxLevel,
  };
  return useInfiniteQuery({
    queryKey: queryKeys.buildList(filters),
    queryFn: ({ pageParam }) =>
      listBuilds({ ...filters, cursor: pageParam, pageSize: BUILDS_PAGE_SIZE }),
    initialPageParam: null as BuildCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  });
}

export interface SearchPage {
  builds: Build[];
  /** Where the next page starts in the matching ids; null when there are no more. */
  nextOffset: number | null;
  /** Every match: the indexed ones plus newer builds found by name (first page only). */
  total: number;
}

/**
 * A search (T74) over the daily index in `stats` (`searchIds`: words anywhere, the filters, the sort),
 * the matches then read by id a page at a time. The first page adds builds newer than the index whose
 * name starts with the search (the old prefix query). Without an index yet, that prefix query alone.
 * `stats` undefined = still loading (the query waits for it).
 */
export function useBuildSearch(filters: BuildFilters, stats: GameStats | null | undefined) {
  const index = stats?.searchIndex;
  const ids = index ? searchIds(index, filters) : [];
  const indexed = new Set(index?.map((entry) => entry.id));
  return useInfiniteQuery({
    queryKey: queryKeys.buildSearch({ ...filters, indexed: Boolean(index) }, ids),
    queryFn: async ({ pageParam: offset }): Promise<SearchPage> => {
      const pageIds = ids.slice(offset, offset + BUILDS_PAGE_SIZE);
      const [builds, byName] = await Promise.all([
        getBuildsByIds(pageIds),
        offset === 0 ? searchBuilds(filters.search, { pageSize: BUILDS_PAGE_SIZE }) : null,
      ]);
      const newer = byName
        ? filterBuilds(
            byName.builds.filter((build) => !indexed.has(build.id)),
            filters,
          )
        : [];
      const next = offset + BUILDS_PAGE_SIZE;
      return {
        builds: [...newer, ...builds],
        nextOffset: next < ids.length ? next : null,
        total: ids.length + newer.length,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: Boolean(filters.search) && stats !== undefined,
  });
}

/** The newest builds, straight from Firestore (T74: Fresh builds, newer than the daily index). */
export function useFreshBuilds(size: number) {
  return useQuery({
    queryKey: queryKeys.freshBuilds(size),
    queryFn: async () => (await listBuilds({ sort: 'new', pageSize: size })).builds,
  });
}

/** Builds by id, in that order (T74: a home shelf). */
export function useBuildsByIds(ids: readonly string[]) {
  return useQuery({
    queryKey: queryKeys.buildsByIds(ids),
    queryFn: () => getBuildsByIds(ids),
    enabled: ids.length > 0,
  });
}

/** Every build a user owns, newest first. */
export function useUserBuilds(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userBuilds(userId ?? ''),
    queryFn: () => listUserBuilds(userId!),
    enabled: Boolean(userId),
  });
}

/**
 * The current game's community stats (top tags, "N builds by M players"; T20; the search index, T74).
 * Written once a day, so it's read once per visit; `data` is null until the daily job (or the seed) has
 * written it.
 */
export function useGameStats() {
  const game = useCurrentGame();
  return useQuery({
    queryKey: queryKeys.stats(game.id),
    queryFn: () => getGameStats(game.id),
    staleTime: 60 * 60 * 1000,
  });
}
