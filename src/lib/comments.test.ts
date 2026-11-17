import { describe, expect, it } from 'vitest';
import { replyPrefix, threadComments, visibleReplies } from './comments';
import type { Comment } from './models';

const at = (day: number) => new Date(Date.UTC(2026, 10, day));

const c = (
  id: string,
  day: number,
  { parentId = null, likeCount = 0 }: { parentId?: string | null; likeCount?: number } = {},
): Comment => ({ id, authorId: 'u', text: id, parentId, likeCount, createdAt: at(day) });

const shape = (threads: ReturnType<typeof threadComments>) =>
  threads.map((t) => `${t.comment ? t.id : `(deleted ${t.id})`}: ${t.replies.map((r) => r.id)}`);

describe('threadComments', () => {
  const comments = [
    c('old', 1, { likeCount: 2 }),
    c('mid', 2, { likeCount: 5 }),
    c('new', 3),
    c('tie', 4, { likeCount: 2 }),
    c('r2', 6, { parentId: 'mid' }),
    c('r1', 5, { parentId: 'mid' }),
  ];

  it('Top: most liked first, ties newest first; replies oldest first under their comment', () => {
    expect(shape(threadComments(comments, 'top'))).toEqual([
      'mid: r1,r2',
      'tie: ',
      'old: ',
      'new: ',
    ]);
  });

  it('Newest: newest top-level comment first, whatever its replies', () => {
    expect(shape(threadComments(comments, 'newest'))).toEqual([
      'tie: ',
      'new: ',
      'mid: r1,r2',
      'old: ',
    ]);
  });

  it('the viewer’s own like doesn’t move a comment', () => {
    const liked = threadComments([c('a', 1, { likeCount: 1 }), c('b', 2)], 'top', new Set(['a']));
    expect(shape(liked)).toEqual(['b: ', 'a: ']);
  });

  it('replies of a deleted comment stay, under a placeholder ranked like an unliked comment', () => {
    const threads = threadComments(
      [c('liked', 1, { likeCount: 1 }), c('newer', 5), c('r1', 3, { parentId: 'gone' })],
      'top',
    );
    expect(shape(threads)).toEqual(['liked: ', 'newer: ', '(deleted gone): r1']);
    expect(threads[2]!.comment).toBeNull();
  });

  it('no comments, no threads', () => {
    expect(threadComments([], 'top')).toEqual([]);
  });
});

describe('visibleReplies', () => {
  const replies = [1, 2, 3, 4, 5].map((day) => c(`r${day}`, day, { parentId: 'p' }));

  it('shows up to three in full', () => {
    expect(visibleReplies(replies.slice(0, 3), false)).toEqual({
      shown: replies.slice(0, 3),
      hidden: 0,
    });
  });

  it('past three, the first two and the rest behind "Show more"', () => {
    expect(visibleReplies(replies, false)).toEqual({ shown: replies.slice(0, 2), hidden: 3 });
    expect(visibleReplies(replies, true)).toEqual({ shown: replies, hidden: 0 });
  });
});

it('replyPrefix names who a reply answers', () => {
  expect(replyPrefix('Ranni')).toBe('@Ranni ');
});
