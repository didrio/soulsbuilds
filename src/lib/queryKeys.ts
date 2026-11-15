// TanStack Query keys, in one place so features invalidate each other's data consistently.
// Prefixes matter: invalidating ['builds'] refreshes every build list and detail.
import type { BuildSort } from './firebase';

export const queryKeys = {
  builds: ['builds'] as const,
  buildList: (filters: { sort: BuildSort; tag?: string }) => ['builds', 'list', filters] as const,
  build: (id: string) => ['builds', 'detail', id] as const,
  userBuilds: (userId: string) => ['builds', 'user', userId] as const,
  likedBuilds: (userId: string) => ['builds', 'liked', userId] as const,
  hasLiked: (buildId: string, userId: string) => ['likes', buildId, userId] as const,
  comments: (buildId: string) => ['comments', buildId] as const,
  user: (id: string) => ['users', id] as const,
};
