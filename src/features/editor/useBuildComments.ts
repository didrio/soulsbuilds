// Comments on the build page: authors' names, newest first, and posting a new one.
import { useState, useEffect, useMemo } from 'react';
import { sortBy } from '@/lib/array';
import { addComment, getUser } from '@/lib/firebase';
import type { BuildComment, User } from '@/lib/models';
import type { AuthState } from './useBuildEditor';

interface UseBuildCommentsOptions {
  auth: AuthState;
  buildId: string | null;
  comments: BuildComment[];
  isLoggedIn: boolean;
}

export function useBuildComments({ auth, buildId, comments, isLoggedIn }: UseBuildCommentsOptions) {
  const [commentText, setCommentText] = useState('');
  const [saveCommentLoading, setSaveCommentLoading] = useState(false);
  const [commentUsers, setCommentUsers] = useState<Record<string, User>>({});

  // One getUser per comment (T4).
  useEffect(() => {
    const run = async () => {
      const result = await Promise.all(comments.map(({ user: userId }) => getUser(userId)));
      const users: Record<string, User> = {};
      result.forEach((user) => {
        if (user) users[user.id] = user;
      });
      setCommentUsers(users);
    };
    run();
  }, [comments]);

  const sortedComments = useMemo(
    () => sortBy(comments, ({ date = -Infinity }) => date).reverse(),
    [comments],
  );

  // Reloads the page to show the new comment (T4).
  const handleSaveComment = async () => {
    if (isLoggedIn && auth && buildId) {
      setSaveCommentLoading(true);
      await addComment(auth.uid, buildId, commentText);
      setCommentText('');
      window.location.reload();
      setSaveCommentLoading(false);
    }
  };

  return {
    commentText,
    commentUsers,
    saveCommentLoading,
    sortedComments,
    setCommentText,
    handleSaveComment,
  };
}
