// TanStack Query keys, in one place so features invalidate each other's data consistently.
// Prefixes matter: invalidating ['builds'] refreshes every build list and detail.
import type { BuildSort } from './firebase';
import type { GameId } from './models';

export const queryKeys = {
  builds: ['builds'] as const,
  buildList: (filters: {
    sort: BuildSort;
    tag?: string;
    search?: string;
    minLevel?: number;
    maxLevel?: number;
  }) => ['builds', 'list', filters] as const,
  build: (id: string) => ['builds', 'detail', id] as const,
  userBuilds: (userId: string) => ['builds', 'user', userId] as const,
  likedBuilds: (userId: string) => ['builds', 'liked', userId] as const,
  hasLiked: (buildId: string, userId: string) => ['likes', buildId, userId] as const,
  comments: (buildId: string) => ['comments', buildId] as const,
  /** A build's newest comment (the phone's Comments header, T49); under the comments prefix. */
  latestComment: (buildId: string) => ['comments', buildId, 'latest'] as const,
  user: (id: string) => ['users', id] as const,
  stats: (game: GameId) => ['stats', game] as const,
  /** One email link opened on `/auth/action` (T43): checked or applied once, then kept. */
  actionLink: (kind: 'resetPassword' | 'verifyEmail', code: string) =>
    ['actionLink', kind, code] as const,
  /** The signed-in player's progress on a build (T34). */
  tracking: (userId: string, buildId: string) => ['tracking', userId, buildId] as const,
  /** Every build the signed-in player tracks, with their progress (the profile, T36). */
  trackedBuilds: (userId: string) => ['trackedBuilds', userId] as const,
  /** Whether the signed-in player tracks any build yet (T41: the intro shows until they do). */
  tracksAnyBuild: (userId: string) => ['tracksAnyBuild', userId] as const,
};
