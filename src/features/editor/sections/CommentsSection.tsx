import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import FlexGroup from '@/components/ui/FlexGroup';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import TextAreaInput from '@/components/ui/TextAreaInput';
import useAuth from '@/features/auth/useAuth';
import { useUserProfiles } from '@/features/profile/queries';
import { errorMessage } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';
import {
  COLOR_LIGHT_GREEN,
  COLOR_LIGHTEST_GREEN,
  COLOR_LIGHTEST_GREEN_LOW_OPACITY,
  BELOW_800,
} from '@/theme';
import { useAddComment, useComments, useDeleteComment } from '../queries';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

/** View mode: the comments, newest first (authors link to their profile), and the post form. */
function CommentsSection({ buildId }: { buildId: string }) {
  const { uid } = useAuth();
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

  return (
    <CommentsContainer>
      <CommentsView aria-labelledby="comments-title">
        <Title id="comments-title">Comments</Title>
        {comments.isPending ? <LoadingAnimation size={30} /> : null}
        {comments.isError ? (
          <ErrorMessage onRetry={() => void comments.refetch()}>
            {errorMessage(comments.error)}
          </ErrorMessage>
        ) : null}
        {comments.data?.length === 0 ? <Empty>No comments yet.</Empty> : null}
        {comments.data?.length ? (
          <CommentList>
            {comments.data.map((comment) => (
              <CommentItem key={comment.id}>
                <CommentMeta>
                  <Link to={`/user/${comment.authorId}`}>
                    {authors[comment.authorId]?.displayName ?? 'Someone'}
                  </Link>
                  <time dateTime={comment.createdAt.toISOString()}>
                    {dateFormat.format(comment.createdAt)}
                  </time>
                  {comment.authorId === uid ? (
                    <DeleteButton
                      type="button"
                      aria-label="Delete your comment"
                      onClick={() => deleteComment.mutate(comment.id)}
                      disabled={deleteComment.isPending}>
                      Delete
                    </DeleteButton>
                  ) : null}
                </CommentMeta>
                <CommentText>{comment.text}</CommentText>
              </CommentItem>
            ))}
          </CommentList>
        ) : null}
        <ErrorMessage>{deleteComment.error ? errorMessage(deleteComment.error) : ''}</ErrorMessage>
      </CommentsView>
      <CommentsPost onSubmit={handleSubmit}>
        <Title as="label" htmlFor="new-comment">
          Post a comment
        </Title>
        <CommentTextAreaContainer>
          <TextAreaInput
            id="new-comment"
            disabled={!uid || addComment.isPending}
            maxLength={LIMITS.comment}
            onChange={setText}
            placeholder={uid ? '' : 'Log in to comment'}
            value={text}
          />
        </CommentTextAreaContainer>
        <ErrorMessage>{addComment.error ? errorMessage(addComment.error) : ''}</ErrorMessage>
        <SaveCommentContainer>
          <Button type="submit" disabled={!text.trim() || addComment.isPending || !uid}>
            Post
          </Button>
        </SaveCommentContainer>
      </CommentsPost>
    </CommentsContainer>
  );
}

const SaveCommentContainer = styled(FlexGroup)`
  justify-content: center;
  margin-top: 20px;
`;

const Title = styled.h2`
  display: block;
  font-size: 24px;
  font-weight: normal;
  margin: 0 0 10px;
  color: ${COLOR_LIGHTEST_GREEN};
`;

const CommentList = styled.ol`
  list-style: none;
  margin: 15px 0 20px;
  padding: 0;
`;

const CommentItem = styled.li`
  border-bottom: 1px dashed ${COLOR_LIGHT_GREEN};
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-size: 18px;

  &:last-child {
    border: none;
  }
`;

const CommentMeta = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;

  & > a {
    color: ${COLOR_LIGHTEST_GREEN};
    font-size: 18px;
    font-weight: bold;
  }
`;

const CommentText = styled.p`
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
`;

const CommentTextAreaContainer = styled(FlexGroup)`
  height: 100px;
  width: 100%;
  margin-top: 15px;
`;

const Empty = styled.p`
  font-size: 18px;
  margin: 0;
`;

const CommentsContainer = styled(FlexGroup)`
  width: 100%;
  border-top: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  padding-top: 20px;

  @media ${BELOW_800} {
    flex-direction: column;
  }
`;

const CommentsPost = styled.form`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  width: 40%;
  padding-left: 30px;

  @media ${BELOW_800} {
    width: 100%;
    padding-left: 0px;
    margin-top: 20px;
  }
`;

const CommentsView = styled.section`
  display: flex;
  flex-direction: column;
  width: 60%;

  @media ${BELOW_800} {
    width: 100%;
  }
`;

export default CommentsSection;
