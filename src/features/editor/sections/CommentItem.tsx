import { Link } from 'react-router';
import styled from 'styled-components';
import { HeartIcon } from '@/components/ui/icons';
import Label from '@/components/ui/Label';
import { TextButton } from '@/components/ui/TextButton';
import ReportButton from '@/features/reports/ReportButton';
import type { Comment } from '@/lib/models';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  MEASURE,
  SPACE_SM,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export const commentLikesLabel = (count: number) => `${count} ${count === 1 ? 'like' : 'likes'}`;

/**
 * One comment or reply (T62): author (linked; "Author" when it's the build's owner), date, Delete
 * (own) and Report up top; the text; Like (heart + count) and Reply below. Signed out, Like and
 * Reply open the log-in dialog (the section decides).
 */
function CommentItem({
  comment,
  authorName,
  buildId,
  isBuildAuthor,
  isOwn,
  liked,
  likeDisabled,
  onLike,
  onReply,
  onDelete,
  deleteDisabled,
}: {
  comment: Comment;
  authorName: string;
  buildId: string;
  isBuildAuthor: boolean;
  isOwn: boolean;
  liked: boolean;
  likeDisabled: boolean;
  onLike: () => void;
  /** Absent under a deleted comment: there's nothing to reply to. */
  onReply?: () => void;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  return (
    <div>
      <Meta>
        <Author to={`/user/${comment.authorId}`}>{authorName}</Author>
        {isBuildAuthor ? <Label>Author</Label> : null}
        <time dateTime={comment.createdAt.toISOString()}>
          {dateFormat.format(comment.createdAt)}
        </time>
        <Controls>
          {isOwn ? (
            <TextButton
              aria-label={comment.parentId ? 'Delete your reply' : 'Delete your comment'}
              onClick={onDelete}
              disabled={deleteDisabled}>
              Delete
            </TextButton>
          ) : null}
          <ReportButton
            target={{ buildId, commentId: comment.id }}
            authorId={comment.authorId}
            kind="comment"
          />
        </Controls>
      </Meta>
      <Text>{comment.text}</Text>
      <Actions>
        <Action
          type="button"
          aria-pressed={liked}
          aria-label={`Like ${authorName}’s ${comment.parentId ? 'reply' : 'comment'}, ${commentLikesLabel(comment.likeCount)}`}
          disabled={likeDisabled}
          onClick={onLike}>
          <Heart filled={liked} $liked={liked} />
          {comment.likeCount ? <span aria-hidden>{comment.likeCount}</span> : null}
        </Action>
        {onReply ? (
          <Action type="button" aria-label={`Reply to ${authorName}`} onClick={onReply}>
            Reply
          </Action>
        ) : null}
      </Actions>
    </div>
  );
}

const Meta = styled.div`
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

// About 72 characters a line, however wide the panel (T67).
const Text = styled.p`
  font-size: ${TEXT_MD};
  margin: ${SPACE_XS} 0 0;
  max-width: ${MEASURE};
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

// Pulled up and left so the 44 px targets don't add a gap under the text.
const Actions = styled.div`
  align-items: center;
  display: flex;
  gap: ${SPACE_XS};
  margin: -${SPACE_XS} 0 -${SPACE_SM} -${SPACE_SM};
`;

// Muted: a like or reply per comment would spend the accent budget many times over.
const Action = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: ${TEXT_SM};
  font-weight: 600;
  gap: 6px;
  min-height: 44px;
  min-width: 44px;
  padding: 0 ${SPACE_SM};

  &:hover {
    color: ${COLOR_TEXT};
  }

  &:disabled {
    cursor: default;
  }
`;

// The accent only when you've liked it, like the build's heart.
const Heart = styled(HeartIcon)<{ $liked: boolean }>`
  color: ${({ $liked }) => ($liked ? COLOR_ACCENT : 'currentColor')};
`;

export default CommentItem;
