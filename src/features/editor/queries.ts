// Server data for the build page: the build, saving/deleting it, likes and comments (TanStack Query
// over src/lib/firebase). Likes and comments update optimistically and roll back on error.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addComment,
  createBuild,
  deleteBuild,
  deleteComment,
  fetchLatestComment,
  getBuild,
  hasLiked,
  likeBuild,
  listLikedBuildIds,
  likeComment,
  listCommentLikes,
  listComments,
  unlikeBuild,
  unlikeComment,
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

/**
 * Creates (no `buildId`) or updates a build; resolves to its id. `ownerId` comes with each save: a
 * signed-out planner signs in on Save (T68), before `useAuth` has caught up.
 */
export function useSaveBuild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      buildId,
      ownerId,
      input,
    }: {
      buildId: string | null;
      ownerId: string | null;
      input: BuildInput;
    }) => {
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

/**
 * The ids of every build the signed-in user likes (T79), so a list's hearts show "liked" with one read
 * instead of one per row. Empty when signed out.
 */
export function useLikedIds(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.likedIds(userId ?? ''),
    queryFn: async () => new Set(await listLikedBuildIds(userId!)),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

/**
 * Likes or unlikes (`liked` = the new state), updating the count and button at once: the build page's
 * Like and (T79) the hearts on build rows.
 */
export function useToggleLike(buildId: string, userId: string | null) {
  const queryClient = useQueryClient();
  const likedKey = queryKeys.hasLiked(buildId, userId ?? '');
  const likedIdsKey = queryKeys.likedIds(userId ?? '');
  const buildKey = queryKeys.build(buildId);
  return useMutation({
    mutationFn: async (liked: boolean) => {
      if (!userId) throw new Error('Log in to like builds.');
      await (liked ? likeBuild(buildId, userId) : unlikeBuild(buildId, userId));
    },
    onMutate: async (liked) => {
      await queryClient.cancelQueries({ queryKey: likedKey });
      await queryClient.cancelQueries({ queryKey: buildKey });
      await queryClient.cancelQueries({ queryKey: likedIdsKey });
      const previous = {
        liked: queryClient.getQueryData<boolean>(likedKey),
        likedIds: queryClient.getQueryData<Set<string>>(likedIdsKey),
        build: queryClient.getQueryData<Build | null>(buildKey),
      };
      queryClient.setQueryData(likedKey, liked);
      if (previous.likedIds) {
        const ids = new Set(previous.likedIds);
        if (liked) ids.add(buildId);
        else ids.delete(buildId);
        queryClient.setQueryData(likedIdsKey, ids);
      }
      queryClient.setQueryData<Build | null>(buildKey, (build) =>
        build ? { ...build, likeCount: Math.max(0, build.likeCount + (liked ? 1 : -1)) } : build,
      );
      return previous;
    },
    onError: (_error, _liked, previous) => {
      queryClient.setQueryData(likedKey, previous?.liked);
      queryClient.setQueryData(likedIdsKey, previous?.likedIds);
      queryClient.setQueryData(buildKey, previous?.build);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: likedKey });
      void queryClient.invalidateQueries({ queryKey: likedIdsKey });
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

/**
 * A build's newest comment, for the phone's Comments header (T49): one read, and none when the full
 * list is already loaded (its first). Its key sits under the list's, so posting or deleting a comment
 * refreshes it too.
 */
export function useLatestComment(buildId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.latestComment(buildId),
    queryFn: () => {
      const list = queryClient.getQueryData<Comment[]>(queryKeys.comments(buildId));
      return list ? (list[0] ?? null) : fetchLatestComment(buildId);
    },
    enabled,
  });
}

/** Posts a comment, or a reply when `parentId` names a top-level comment (T62). */
export function useAddComment(buildId: string, userId: string | null) {
  const queryClient = useQueryClient();
  const key = queryKeys.comments(buildId);
  return useMutation({
    mutationFn: ({ text, parentId = null }: { text: string; parentId?: string | null }) => {
      if (!userId) throw new Error('Log in to comment.');
      return addComment(buildId, userId, text, parentId);
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
    // The build's count (the header's "N Comments" link) follows at once, like on add.
    onSuccess: () =>
      queryClient.setQueryData<Build | null>(queryKeys.build(buildId), (build) =>
        build ? { ...build, commentCount: Math.max(0, build.commentCount - 1) } : build,
      ),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: queryKeys.builds });
    },
  });
}

/** Ids of the build's comments the signed-in user likes (T62; empty when signed out). */
export function useCommentLikes(buildId: string, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.commentLikes(buildId, userId ?? ''),
    queryFn: () => listCommentLikes(buildId, userId!),
    enabled: Boolean(userId),
  });
}

/**
 * Likes or unlikes a comment (`liked` = the new state), updating its heart and count at once and
 * rolling back on error, like useToggleLike.
 */
export function useToggleCommentLike(buildId: string, userId: string | null) {
  const queryClient = useQueryClient();
  const likesKey = queryKeys.commentLikes(buildId, userId ?? '');
  const listKey = queryKeys.comments(buildId);
  return useMutation({
    mutationFn: async ({ commentId, liked }: { commentId: string; liked: boolean }) => {
      if (!userId) throw new Error('Log in to like comments.');
      await (liked
        ? likeComment(buildId, commentId, userId)
        : unlikeComment(buildId, commentId, userId));
    },
    onMutate: async ({ commentId, liked }) => {
      await queryClient.cancelQueries({ queryKey: likesKey });
      await queryClient.cancelQueries({ queryKey: listKey, exact: true });
      const previous = {
        likes: queryClient.getQueryData<Set<string>>(likesKey),
        list: queryClient.getQueryData<Comment[]>(listKey),
      };
      queryClient.setQueryData<Set<string>>(likesKey, (likes = new Set()) => {
        const next = new Set(likes);
        if (liked) next.add(commentId);
        else next.delete(commentId);
        return next;
      });
      queryClient.setQueryData<Comment[]>(listKey, (comments) =>
        comments?.map((comment) =>
          comment.id === commentId
            ? { ...comment, likeCount: Math.max(0, comment.likeCount + (liked ? 1 : -1)) }
            : comment,
        ),
      );
      return previous;
    },
    onError: (_error, _variables, previous) => {
      queryClient.setQueryData(likesKey, previous?.likes);
      queryClient.setQueryData(listKey, previous?.list);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: likesKey });
      void queryClient.invalidateQueries({ queryKey: listKey, exact: true });
    },
  });
}
