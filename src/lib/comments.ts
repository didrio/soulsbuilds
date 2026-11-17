// A build's comments as threads (T62): top-level comments sorted Top or Newest, each with its
// replies (one level) oldest first. Pure.
import type { Comment } from './models';

export type CommentSort = 'top' | 'newest';

export interface Thread {
  /** The top-level comment's id (also when it was deleted). */
  id: string;
  /** Null when the top-level comment was deleted but its replies remain ("Comment deleted"). */
  comment: Comment | null;
  /** Oldest first. */
  replies: Comment[];
}

/**
 * Groups replies under their top-level comment and sorts the threads. Top: most liked first, ties
 * newest first. A comment's rank leaves out the viewer's own like (`likedByViewer`), so liking a
 * comment never moves it under your cursor. A deleted comment's thread ranks like a comment with no
 * likes posted when its first reply was.
 */
export function threadComments(
  comments: readonly Comment[],
  sort: CommentSort,
  likedByViewer: ReadonlySet<string> = new Set(),
): Thread[] {
  const tops = new Map<string, Comment>();
  const replies = new Map<string, Comment[]>();
  for (const comment of comments) {
    if (comment.parentId === null) tops.set(comment.id, comment);
    else replies.set(comment.parentId, [...(replies.get(comment.parentId) ?? []), comment]);
  }
  for (const list of replies.values()) list.sort(byDate);

  const threads: Thread[] = [...tops.values()].map((comment) => ({
    id: comment.id,
    comment,
    replies: replies.get(comment.id) ?? [],
  }));
  for (const [id, list] of replies) {
    if (!tops.has(id)) threads.push({ id, comment: null, replies: list });
  }

  const date = (thread: Thread) => (thread.comment ?? thread.replies[0]!).createdAt.getTime();
  const score = (thread: Thread) =>
    thread.comment ? thread.comment.likeCount - (likedByViewer.has(thread.comment.id) ? 1 : 0) : 0;
  return threads.sort((a, b) => (sort === 'top' ? score(b) - score(a) : 0) || date(b) - date(a));
}

const byDate = (a: Comment, b: Comment) => a.createdAt.getTime() - b.createdAt.getTime();

/** Up to this many replies show in full; past it, the first two and "Show N more replies". */
export const REPLIES_SHOWN = 3;

/** The replies to show and how many are behind "Show N more replies". */
export function visibleReplies(
  replies: readonly Comment[],
  expanded: boolean,
): { shown: readonly Comment[]; hidden: number } {
  if (expanded || replies.length <= REPLIES_SHOWN) return { shown: replies, hidden: 0 };
  return { shown: replies.slice(0, 2), hidden: replies.length - 2 };
}

/** How a reply to a reply starts: "@Name " (one reply level, so it says who it answers). */
export const replyPrefix = (name: string) => `@${name} `;
