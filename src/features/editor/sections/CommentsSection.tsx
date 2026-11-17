import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Frame from '@/components/ui/Frame';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import SectionHeading from '@/components/ui/SectionHeading';
import TextAreaInput from '@/components/ui/TextAreaInput';
import { TextButton } from '@/components/ui/TextButton';
import useAuth from '@/features/auth/useAuth';
import { useUserProfile, useUserProfiles } from '@/features/profile/queries';
import ReportButton from '@/features/reports/ReportButton';
import { errorMessage } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';
import {
  COLOR_ACCENT_STRONG,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { useAddComment, useComments, useDeleteComment } from '../queries';
import { labelText } from '@/components/ui/typography';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

/**
 * View mode: the comments, newest first (authors link to their profile), and the post form. With no
 * comments yet, it asks visitors to tell the build's author how it went.
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
  const owner = useUserProfile(ownerId);
  const comments = useComments(buildId);
  const authors = useUserProfiles((comments.data ?? []).map((comment) => comment.authorId));
  const addComment = useAddComment(buildId, uid);
  const deleteComment = useDeleteComment(buildId);
  const [text, setText] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    addComment.mutate(text, { onSuccess: () => setText('') });
  };

  const list = comments.data ?? [];
  const count = comments.data?.length;

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
      {count ? (
        <CommentList>
          {list.map((comment) => (
            <CommentItem key={comment.id}>
              <CommentMeta>
                <Author to={`/user/${comment.authorId}`}>
                  {authors[comment.authorId]?.displayName ?? 'Someone'}
                </Author>
                <time dateTime={comment.createdAt.toISOString()}>
                  {dateFormat.format(comment.createdAt)}
                </time>
                <Controls>
                  {comment.authorId === uid ? (
                    <TextButton
                      aria-label="Delete your comment"
                      onClick={() => deleteComment.mutate(comment.id)}
                      disabled={deleteComment.isPending}>
                      Delete
                    </TextButton>
                  ) : null}
                  <ReportButton
                    target={{ buildId, commentId: comment.id }}
                    authorId={comment.authorId}
                    kind="comment"
                  />
                </Controls>
              </CommentMeta>
              <CommentText>{comment.text}</CommentText>
            </CommentItem>
          ))}
        </CommentList>
      ) : null}
      <ErrorMessage>{deleteComment.error ? errorMessage(deleteComment.error) : ''}</ErrorMessage>
      <PostForm onSubmit={handleSubmit}>
        <Label htmlFor="new-comment">Post a comment</Label>
        <TextAreaInput
          id="new-comment"
          disabled={!uid || addComment.isPending}
          maxLength={LIMITS.comment}
          onChange={setText}
          placeholder={uid ? 'What worked for you?' : 'Log in to comment'}
          rows={3}
          value={text}
        />
        <ErrorMessage>{addComment.error ? errorMessage(addComment.error) : ''}</ErrorMessage>
        <div>
          <Button type="submit" disabled={!text.trim() || addComment.isPending || !uid}>
            Post
          </Button>
        </div>
      </PostForm>
    </>
  );
  if (bare) return <div>{body}</div>;
  return (
    <Frame aria-labelledby="comments-title">
      <SectionHeading id="comments-title">
        {count ? `Comments · ${count}` : 'Comments'}
      </SectionHeading>
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

// Comments span the page (T22): the thread and form keep a readable line length.
const READABLE = '72ch';

const CommentList = styled.ol`
  list-style: none;
  margin: 0;
  max-width: ${READABLE};
  padding: 0;
`;

// Separated by a hairline.
const CommentItem = styled.li`
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

const CommentMeta = styled.div`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-wrap: wrap;
  font-size: ${TEXT_XS};
  gap: 0 ${SPACE_SM};
`;

const Author = styled(Link)`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_SM};
  font-weight: 600;

  &:hover {
    color: ${COLOR_ACCENT_STRONG};
  }
`;

const Controls = styled.span`
  align-items: center;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0 ${SPACE_XS};
  margin-left: auto;
`;

const CommentText = styled.p`
  font-size: ${TEXT_MD};
  margin: ${SPACE_XS} 0 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const PostForm = styled.form`
  display: grid;
  gap: ${SPACE_SM};
  margin-top: ${SPACE_LG};
  max-width: ${READABLE};
`;

const Label = styled.label`
  ${labelText}
`;

export default CommentsSection;
