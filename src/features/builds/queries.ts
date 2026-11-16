// Server data for build lists (TanStack Query over src/lib/firebase).
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCurrentGame } from '@/app/game';
import {
  getGameStats,
  listBuilds,
  listUserBuilds,
  searchBuilds,
  type BuildCursor,
  type BuildSort,
} from '@/lib/firebase';
import { queryKeys } from '@/lib/queryKeys';

export const BUILDS_PAGE_SIZE = 24;

/**
 * Elden Ring builds a page at a time (`fetchNextPage`), all filtered in Firestore: most liked or newest
 * first (or by name when `search` is a name prefix), optionally one tag and a level range.
 */
export function useBuilds({
  sort,
  tag,
  search,
  minLevel,
  maxLevel,
}: {
  sort: BuildSort;
  tag?: string;
  search?: string;
  minLevel?: number;
  maxLevel?: number;
}) {
  const filters = { sort: search ? ('top' as const) : sort, search, tag, minLevel, maxLevel };
  return useInfiniteQuery({
    queryKey: queryKeys.buildList(filters),
    queryFn: ({ pageParam }) => {
      const options = { tag, minLevel, maxLevel, cursor: pageParam, pageSize: BUILDS_PAGE_SIZE };
      return search ? searchBuilds(search, options) : listBuilds({ sort, ...options });
    },
    initialPageParam: null as BuildCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
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
 * The current game's community stats (top tags, "N builds by M players"; T20). Written once a day,
 * so it's read once per visit; `data` is null until the daily job (or the seed) has written it.
 */
export function useGameStats() {
  const game = useCurrentGame();
  return useQuery({
    queryKey: queryKeys.stats(game.id),
    queryFn: () => getGameStats(game.id),
    staleTime: 60 * 60 * 1000,
  });
}
