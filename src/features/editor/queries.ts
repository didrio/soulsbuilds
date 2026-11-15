// Server data for the build page: the build, saving/deleting it, likes and comments (TanStack Query
// over src/lib/firebase). Likes and comments update optimistically and roll back on error.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addComment,
  createBuild,
  deleteBuild,
  deleteComment,
  getBuild,
  hasLiked,
  likeBuild,
  listComments,
  unlikeBuild,
  updateBuild,
  type BuildInput,
} from '@/lib/firebase';
import { calculateLevel } from '@/lib/buildMath';
import type { Build, Comment } from '@/lib/models';
import { queryKeys } from '@/lib/queryKeys';

/** The build; `data` is null when it doesn't exist. Pass null for /build/new. */
export function useBuild(buildId: string | null) {
  return useQuery({
    queryKey: queryKeys.build(buildId ?? ''),
    queryFn: () => getBuild(buildId!),
    enabled: Boolean(buildId),
  });
}

/** Creates (no `buildId`) or updates a build; resolves to its id. */
export function useSaveBuild(ownerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ buildId, input }: { buildId: string | null; input: BuildInput }) => {
      if (!ownerId) throw new Error('Log in to save a build.');
      if (buildId) {
        await updateBuild(buildId, input);
        return buildId;
      }
      return createBuild(ownerId, input);
    },
    onSuccess: async (buildId, { input }) => {
      // Show the saved version right away (the refetch below confirms it).
      queryClient.setQueryData<Build | null>(queryKeys.build(buildId), (build) =>
        build
          ? {
              ...build,
              ...input,
              name: input.name.trim(),
              level: calculateLevel(input.stats),
              updatedAt: new Date(),
            }
          : build,
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.builds });
    },
  });
}

export function useDeleteBuild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (buildId: string) => deleteBuild(buildId),
    onSuccess: (_data, buildId) => {
      queryClient.setQueryData(queryKeys.build(buildId), null);
      return queryClient.invalidateQueries({ queryKey: queryKeys.builds });
    },
  });
}

/** Whether the signed-in user likes the build (false when signed out). */
export function useHasLiked(buildId: string | null, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.hasLiked(buildId ?? '', userId ?? ''),
    queryFn: () => hasLiked(buildId!, userId!),
    enabled: Boolean(buildId && userId),
  });
}

/** Likes or unlikes (`liked` = the new state), updating the count and button at once. */
export function useToggleLike(buildId: string, userId: string | null) {
  const queryClient = useQueryClient();
  const likedKey = queryKeys.hasLiked(buildId, userId ?? '');
  const buildKey = queryKeys.build(buildId);
  return useMutation({
    mutationFn: async (liked: boolean) => {
      if (!userId) throw new Error('Log in to like builds.');
      await (liked ? likeBuild(buildId, userId) : unlikeBuild(buildId, userId));
    },
    onMutate: async (liked) => {
      await queryClient.cancelQueries({ queryKey: likedKey });
      await queryClient.cancelQueries({ queryKey: buildKey });
      const previous = {
        liked: queryClient.getQueryData<boolean>(likedKey),
        build: queryClient.getQueryData<Build | null>(buildKey),
      };
      queryClient.setQueryData(likedKey, liked);
      queryClient.setQueryData<Build | null>(buildKey, (build) =>
        build ? { ...build, likeCount: Math.max(0, build.likeCount + (liked ? 1 : -1)) } : build,
      );
      return previous;
    },
    onError: (_error, _liked, previous) => {
      queryClient.setQueryData(likedKey, previous?.liked);
      queryClient.setQueryData(buildKey, previous?.build);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: likedKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.builds });
    },
  });
}

/** A build's comments, newest first. */
export function useComments(buildId: string | null) {
  return useQuery({
    queryKey: queryKeys.comments(buildId ?? ''),
    queryFn: () => listComments(buildId!),
    enabled: Boolean(buildId),
  });
}

export function useAddComment(buildId: string, userId: string | null) {
  const queryClient = useQueryClient();
  const key = queryKeys.comments(buildId);
  return useMutation({
    mutationFn: (text: string) => {
      if (!userId) throw new Error('Log in to comment.');
      return addComment(buildId, userId, text);
    },
    onSuccess: (comment) => {
      queryClient.setQueryData<Comment[]>(key, (comments = []) => [comment, ...comments]);
      queryClient.setQueryData<Build | null>(queryKeys.build(buildId), (build) =>
        build ? { ...build, commentCount: build.commentCount + 1 } : build,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: queryKeys.builds });
    },
  });
}

export function useDeleteComment(buildId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.comments(buildId);
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(buildId, commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Comment[]>(key);
      queryClient.setQueryData<Comment[]>(key, (comments = []) =>
        comments.filter((comment) => comment.id !== commentId),
      );
      return previous;
    },
    onError: (_error, _commentId, previous) => queryClient.setQueryData(key, previous),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: queryKeys.builds });
    },
  });
}
