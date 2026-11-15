// Server data for user profiles (TanStack Query over src/lib/firebase).
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, listLikedBuildIds, getBuild, updateDisplayName } from '@/lib/firebase';
import type { Build, UserProfile } from '@/lib/models';
import { queryKeys } from '@/lib/queryKeys';

/** A user's public profile; `data` is null when the user doesn't exist. */
export function useUserProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.user(userId ?? ''),
    queryFn: () => getUserProfile(userId!),
    enabled: Boolean(userId),
  });
}

/** Several profiles (e.g. comment authors), each cached on its own; keyed by id once loaded. */
export function useUserProfiles(userIds: string[]): Record<string, UserProfile> {
  const results = useQueries({
    queries: [...new Set(userIds)].map((id) => ({
      queryKey: queryKeys.user(id),
      queryFn: () => getUserProfile(id),
    })),
  });
  return Object.fromEntries(
    results.flatMap(({ data }) => (data ? [[data.id, data] as const] : [])),
  );
}

/** Builds a user liked, most recent like first (deleted builds are skipped). */
export function useLikedBuilds(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.likedBuilds(userId ?? ''),
    queryFn: async (): Promise<Build[]> => {
      const ids = await listLikedBuildIds(userId!);
      const builds = await Promise.all(ids.map(getBuild));
      return builds.filter((build): build is Build => build !== null);
    },
    enabled: Boolean(userId),
  });
}

export function useUpdateDisplayName(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) => updateDisplayName(userId, displayName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) }),
  });
}
