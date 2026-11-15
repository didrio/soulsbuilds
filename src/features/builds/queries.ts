// Server data for build lists (TanStack Query over src/lib/firebase).
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { listBuilds, listUserBuilds, type BuildCursor, type BuildSort } from '@/lib/firebase';
import { queryKeys } from '@/lib/queryKeys';

export const BUILDS_PAGE_SIZE = 24;

/** Elden Ring builds, most liked or newest first, a page at a time (`fetchNextPage`). */
export function useBuilds({ sort, tag }: { sort: BuildSort; tag?: string }) {
  return useInfiniteQuery({
    queryKey: queryKeys.buildList({ sort, tag }),
    queryFn: ({ pageParam }) =>
      listBuilds({ sort, tag, cursor: pageParam, pageSize: BUILDS_PAGE_SIZE }),
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
