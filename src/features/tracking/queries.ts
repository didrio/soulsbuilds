// Server data for tracking beyond the build page (T36): the player's tracked builds for their profile.
// The build page's own progress lives in useBuildTracking (query cache + save queue).
import { useQuery } from '@tanstack/react-query';
import { getBuild, listTracking } from '@/lib/firebase';
import type { Build } from '@/lib/models';
import { queryKeys } from '@/lib/queryKeys';
import type { TrackingState } from '@/lib/tracking';

export interface TrackedBuild {
  build: Build;
  state: TrackingState;
}

/**
 * The builds a player tracks, split into in progress (latest started first) and finished (latest
 * finished first). Builds deleted since are left out. Only the player can read these (private).
 */
export function useTrackedBuilds(uid: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.trackedBuilds(uid ?? ''),
    queryFn: async () => {
      const tracked = await listTracking(uid!);
      const builds = await Promise.all(tracked.map(({ buildId }) => getBuild(buildId)));
      return splitTracked(
        tracked.flatMap(({ state }, index) => {
          const build = builds[index];
          return build ? [{ build, state }] : [];
        }),
      );
    },
    enabled: Boolean(uid),
  });
}

const newestFirst = (a: Date, b: Date) => b.getTime() - a.getTime();

/** In progress and finished, each newest first. */
export function splitTracked(tracked: TrackedBuild[]) {
  const playing = tracked
    .filter(({ state }) => !state.completedAt)
    .sort((a, b) => newestFirst(a.state.startedAt, b.state.startedAt));
  const finished = tracked
    .filter(({ state }) => state.completedAt)
    .sort((a, b) => newestFirst(a.state.completedAt!, b.state.completedAt!));
  return { playing, finished };
}
