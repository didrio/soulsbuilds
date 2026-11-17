// TanStack Query keys, in one place so features invalidate each other's data consistently.
// Prefixes matter: invalidating ['builds'] refreshes every build list and detail.
import type { BuildSort } from './firebase';
import type { GameId } from './models';

export const queryKeys = {
  builds: ['builds'] as const,
  buildList: (filters: {
    sort: BuildSort;
    tag?: string;
    weaponId?: number;
    minLevel?: number;
    maxLevel?: number;
  }) => ['builds', 'list', filters] as const,
  /** A search over the daily index (T74): the matching ids, read a page at a time. */
  buildSearch: (filters: object, ids: readonly string[]) =>
    ['builds', 'search', filters, ids] as const,
  /** The newest builds (T74: the home's Fresh builds shelf). */
  freshBuilds: (size: number) => ['builds', 'fresh', size] as const,
  /** Builds read by id (T74: the home shelves). */
  buildsByIds: (ids: readonly string[]) => ['builds', 'ids', ids] as const,
  /** Builds with a weapon, most liked first (T55's weapon pages). */
  weaponBuilds: (weaponId: number) => ['builds', 'weapon', weaponId] as const,
  build: (id: string) => ['builds', 'detail', id] as const,
  userBuilds: (userId: string) => ['builds', 'user', userId] as const,
  likedBuilds: (userId: string) => ['builds', 'liked', userId] as const,
  hasLiked: (buildId: string, userId: string) => ['likes', buildId, userId] as const,
  comments: (buildId: string) => ['comments', buildId] as const,
  /** A build's newest comment (the phone's Comments header, T49); under the comments prefix. */
  latestComment: (buildId: string) => ['comments', buildId, 'latest'] as const,
  /**
   * The comments on a build the user likes (T62). Not under the comments prefix: posting a comment
   * doesn't change it.
   */
  commentLikes: (buildId: string, userId: string) => ['commentLikes', buildId, userId] as const,
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
