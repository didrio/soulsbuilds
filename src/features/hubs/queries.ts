// Server data for the weapon and tag pages (T55). Tag pages reuse the landing's `useBuilds`.
import { useInfiniteQuery } from '@tanstack/react-query';
import { listBuildsByWeapon, type BuildCursor } from '@/lib/firebase';
import { HUB_PAGE_SIZE } from '@/lib/hubs';
import { queryKeys } from '@/lib/queryKeys';

/** Builds with the weapon in either hand, most liked first, a page at a time. */
export function useWeaponBuilds(weaponId: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.weaponBuilds(weaponId),
    queryFn: ({ pageParam }) =>
      listBuildsByWeapon(weaponId, { cursor: pageParam, pageSize: HUB_PAGE_SIZE }),
    initialPageParam: null as BuildCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
