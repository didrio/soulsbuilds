import { useState } from 'react';
import styled, { css } from 'styled-components';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Frame from '@/components/ui/Frame';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import SectionHeading from '@/components/ui/SectionHeading';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { TextButton } from '@/components/ui/TextButton';
import { useOpenAuthDialog } from '@/app/authDialog';
import useAuth from '@/features/auth/useAuth';
import { useUserProfile, useUserProfiles } from '@/features/profile/queries';
import { replyPrefix, threadComments, visibleReplies, type CommentSort } from '@/lib/comments';
import { errorMessage } from '@/lib/firebase';
import type { Comment } from '@/lib/models';
import {
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  TEXT_SM,
} from '@/theme';
import {
  useAddComment,
  useCommentLikes,
  useComments,
  useDeleteComment,
  useToggleCommentLike,
} from '../queries';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const SORTS = [
  { value: 'top', label: 'Top' },
  { value: 'newest', label: 'Newest' },
] as const;

/**
 * View mode: the comments as threads (T62: Top or Newest, one reply level, likes), each author
 * linked to their profile, and the post form. Full width of the column it sits in. With no comments
 * yet, it asks visitors to tell the build's author how it went.
 */
function CommentsSection({
  buildId,
  ownerId,
  bare = false,
}: {
  buildId: string;
  ownerId: string;
  /** The phone's Comments section (T49): no panel or heading of its own. */
  bare?: boolean;
}) {
  const { uid } = useAuth();
  const openAuthDialog = useOpenAuthDialog();
  const owner = useUserProfile(ownerId);
  const comments = useComments(buildId);
  const authors = useUserProfiles((comments.data ?? []).map((comment) => comment.authorId));
  const likes = useCommentLikes(buildId, uid);
  const toggleLike = useToggleCommentLike(buildId, uid);
  const addComment = useAddComment(buildId, uid);
  const addReply = useAddComment(buildId, uid);
  const deleteComment = useDeleteComment(buildId);
  const [sort, setSort] = useState<CommentSort>('top');
  /** Like changes since the order was set (`threadComments`): the order holds until a sort is chosen. */
  const [held, setHeld] = useState<ReadonlyMap<string, number>>(new Map());
  const hold = (commentId: string, delta: number) =>
    setHeld((current) => {
      const next = new Map(current);
      const total = (next.get(commentId) ?? 0) + delta;
      if (total) next.set(commentId, total);
      else next.delete(commentId);
      return next;
    });
  const chooseSort = (next: CommentSort) => {
    setSort(next);
    setHeld(new Map());
  };
  /** The open reply form: its thread and what it starts with ("@Name " for a reply to a reply). */
  const [replying, setReplying] = useState<{ threadId: string; prefix: string } | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const list = comments.data ?? [];
  const count = comments.data?.length;
  const liked = likes.data ?? new Set<string>();
  const threads = threadComments(list, sort, held);
  const nameOf = (comment: Comment) => authors[comment.authorId]?.displayName ?? 'Someone';

  const openReply = (threadId: string, prefix: string) => {
    if (!uid) {
      openAuthDialog('login');
      return;
    }
    addReply.reset();
    setReplying({ threadId, prefix });
  };

  const item = (comment: Comment, threadId: string | null, isReply: boolean) => (
    <CommentItem
      comment={comment}
      authorName={nameOf(comment)}
      buildId={buildId}
      isBuildAuthor={comment.authorId === ownerId}
      isOwn={comment.authorId === uid}
      liked={liked.has(comment.id)}
      likeDisabled={toggleLike.isPending || (Boolean(uid) && likes.isPending)}
      onLike={() => {
        if (!uid) {
          openAuthDialog('login');
          return;
        }
        const like = !liked.has(comment.id);
        const delta = like ? 1 : -1;
        hold(comment.id, delta);
        toggleLike.mutate(
          { commentId: comment.id, liked: like },
          { onError: () => hold(comment.id, -delta) },
        );
      }}
      // Replies to a reply join the same thread, naming who they answer (one level).
      onReply={
        threadId
          ? () => openReply(threadId, isReply ? replyPrefix(nameOf(comment)) : '')
          : undefined
      }
      onDelete={() => deleteComment.mutate(comment.id)}
      deleteDisabled={deleteComment.isPending}
    />
  );

  // Beside the heading in the panel; above the list in the phone's section.
  const sortControl =
    threads.length > 1 ? (
      <SegmentedControl label="Sort comments" options={SORTS} value={sort} onChange={chooseSort} />
    ) : null;

  const body = (
    <>
      {comments.isPending ? <LoadingAnimation size={30} /> : null}
      {comments.isError ? (
        <ErrorMessage onRetry={() => void comments.refetch()}>
          {errorMessage(comments.error)}
        </ErrorMessage>
      ) : null}
      {count === 0 ? (
        <Empty>
          No comments yet.
          {uid !== ownerId ? (
            <>
              {' '}
              Tried it? Tell <b>{owner.data?.displayName ?? 'the author'}</b> how it went.
            </>
          ) : null}
        </Empty>
      ) : null}
      {sortControl && bare ? <Toolbar>{sortControl}</Toolbar> : null}
      {threads.length ? (
        <ThreadList>
          {threads.map((thread) => {
            const { shown, hidden } = visibleReplies(thread.replies, expanded.has(thread.id));
            const replyOpen = replying?.threadId === thread.id && thread.comment !== null;
            const canReply = thread.comment ? thread.id : null;
            return (
              <Thread key={thread.id}>
                {thread.comment ? (
                  item(thread.comment, canReply, false)
                ) : (
                  <Deleted>Comment deleted</Deleted>
                )}
                {shown.length ? (
                  <Replies>
                    {shown.map((reply) => (
                      <Reply key={reply.id}>{item(reply, canReply, true)}</Reply>
                    ))}
                    {hidden ? (
                      <li>
                        <TextButton onClick={() => setExpanded(new Set([...expanded, thread.id]))}>
                          Show {hidden} more {hidden === 1 ? 'reply' : 'replies'}
                        </TextButton>
                      </li>
                    ) : null}
                  </Replies>
                ) : null}
                {replyOpen && replying ? (
                  <ReplyBox>
                    <CommentForm
                      key={replying.prefix}
                      id={`reply-${thread.id}`}
                      label={`Reply to ${nameOf(thread.comment!)}`}
                      placeholder="Your reply"
                      initialText={replying.prefix}
                      signedIn={Boolean(uid)}
                      pending={addReply.isPending}
                      error={addReply.error}
                      submitLabel="Reply"
                      focus
                      onCancel={() => setReplying(null)}
                      onSubmit={(text) =>
                        addReply.mutate(
                          { text, parentId: thread.id },
                          {
                            onSuccess: () => {
                              setReplying(null);
                              // The new reply is the newest: show the whole thread so it's there.
                              setExpanded(new Set([...expanded, thread.id]));
                            },
                          },
                        )
                      }
                    />
                  </ReplyBox>
                ) : null}
              </Thread>
            );
          })}
        </ThreadList>
      ) : null}
      <ErrorMessage>
        {deleteComment.error
          ? errorMessage(deleteComment.error)
          : toggleLike.error
            ? errorMessage(toggleLike.error)
            : ''}
      </ErrorMessage>
      <PostBox>
        <CommentForm
          id="new-comment"
          label="Post a comment"
          placeholder="What worked for you?"
          signedIn={Boolean(uid)}
          pending={addComment.isPending}
          error={addComment.error}
          submitLabel="Post"
          onSubmit={(text, clear) => addComment.mutate({ text }, { onSuccess: clear })}
        />
      </PostBox>
    </>
  );
  if (bare) return <div>{body}</div>;
  return (
    <Frame aria-labelledby="comments-title">
      <Heading>
        <SectionHeading id="comments-title">
          {count ? `Comments · ${count}` : 'Comments'}
        </SectionHeading>
        {sortControl}
      </Heading>
      {body}
    </Frame>
  );
}

const Empty = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
  text-align: center;

  & > b {
    color: ${COLOR_TEXT};
    font-weight: 600;
  }
`;

const Heading = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  justify-content: space-between;
  margin-bottom: ${SPACE_SM};

  & > h2 {
    margin: 0;
  }
`;

const Toolbar = styled.div`
  margin-bottom: ${SPACE_SM};
`;

// Comments fill the column (T62), like the write-up above them.
const ThreadList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
`;

// Threads are separated by a hairline.
const Thread = styled.li`
  padding: ${SPACE_MD} 0;
  position: relative;

  & + &::before {
    background: ${COLOR_LINE};
    content: '';
    height: 1px;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }
`;

const Deleted = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  font-style: italic;
  margin: 0;
`;

// One level, indented behind a rule.
const indented = css`
  border-left: 1px solid ${COLOR_LINE};
  margin: ${SPACE_SM} 0 0 ${SPACE_SM};
  padding-left: ${SPACE_MD};
`;

const Replies = styled.ol`
  ${indented}
  list-style: none;
`;

const Reply = styled.li`
  padding: ${SPACE_SM} 0;
`;

const ReplyBox = styled.div`
  ${indented}
  padding-bottom: ${SPACE_SM};
  padding-top: ${SPACE_SM};
`;

const PostBox = styled.div`
  margin-top: ${SPACE_LG};
`;

export default CommentsSection;
