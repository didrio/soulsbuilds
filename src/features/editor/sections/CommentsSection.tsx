import { Link } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import FlexGroup from '@/components/ui/FlexGroup';
import TextAreaInput from '@/components/ui/TextAreaInput';
import type { BuildComment, User } from '@/lib/models';
import {
  COLOR_LIGHT_GREEN,
  COLOR_LIGHTEST_GREEN,
  COLOR_LIGHTEST_GREEN_LOW_OPACITY,
  BELOW_800,
} from '@/theme';

interface CommentsSectionProps {
  commentText: string;
  commentUsers: Record<string, User>;
  isLoggedIn: boolean;
  onCommentTextChange: (text: string) => void;
  onPost: () => void;
  saveCommentLoading: boolean;
  /** Newest first. */
  sortedComments: BuildComment[];
}

/** View mode: the comments (author links to their profile) and the "Post a comment" form. */
function CommentsSection({
  commentText,
  commentUsers,
  isLoggedIn,
  onCommentTextChange,
  onPost,
  saveCommentLoading,
  sortedComments,
}: CommentsSectionProps) {
  return (
    <CommentsContainer>
      <CommentsView>
        <CommentTitleContainer>Comments</CommentTitleContainer>
        {sortedComments.length ? (
          <UserCommentsContainer vertical>
            {sortedComments.map(({ comment, user, date }) => (
              <UserCommentContainer key={`${comment}${date}`} vertical>
                <UserContainer>
                  <Link to={`/user/${user}`}>{commentUsers?.[user]?.name}</Link>
                </UserContainer>
                <FlexGroup>{comment}</FlexGroup>
              </UserCommentContainer>
            ))}
          </UserCommentsContainer>
        ) : (
          <NoCommentsContainer>None for this build</NoCommentsContainer>
        )}
      </CommentsView>
      <CommentsPost>
        <CommentTitleContainer>Post a comment</CommentTitleContainer>
        <CommentTextAreaContainer>
          <TextAreaInput
            disabled={!isLoggedIn}
            onChange={onCommentTextChange}
            value={commentText}
          />
        </CommentTextAreaContainer>
        <SaveCommentContainer>
          <Button disabled={!commentText || saveCommentLoading || !isLoggedIn} onClick={onPost}>
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

const CommentTitleContainer = styled(FlexGroup)`
  font-size: 24px;
  margin-bottom: 10px;
  color: ${COLOR_LIGHTEST_GREEN};
`;

const UserCommentsContainer = styled(FlexGroup)`
  margin-bottom: 20px;
  margin-top: 15px;
`;

const UserCommentContainer = styled(FlexGroup)`
  border-bottom: 1px dashed ${COLOR_LIGHT_GREEN};
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-size: 18px;

  &:last-child {
    border: none;
  }
`;

const UserContainer = styled(FlexGroup)`
  color: ${COLOR_LIGHTEST_GREEN};
  cursor: pointer;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 10px;
`;

const CommentTextAreaContainer = styled(FlexGroup)`
  height: 100px;
  width: 100%;
  margin-top: 15px;
`;

const NoCommentsContainer = styled(FlexGroup)`
  font-size: 18px;
`;

const CommentsContainer = styled(FlexGroup)`
  width: 100%;
  border-top: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  padding-top: 20px;

  @media ${BELOW_800} {
    flex-direction: column;
  }
`;

const CommentsPost = styled(FlexGroup)`
  align-items: flex-start;
  flex-direction: column;
  width: 40%;
  padding-left: 30px;

  @media ${BELOW_800} {
    width: 100%;
    padding-left: 0px;
  }
`;

const CommentsView = styled(FlexGroup)`
  flex-direction: column;
  width: 60%;

  @media ${BELOW_800} {
    width: 100%;
  }
`;

export default CommentsSection;
