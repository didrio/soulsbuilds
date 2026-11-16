import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Frame from '@/components/ui/Frame';
import Tag from '@/components/ui/Tag';
import { CommentIcon, HeartIcon } from '@/components/ui/icons';
import useAuth from '@/features/auth/useAuth';
import ReportButton from '@/features/reports/ReportButton';
import { useUserProfile } from '@/features/profile/queries';
import { errorMessage } from '@/lib/firebase';
import type { Build } from '@/lib/models';
import { formatFullDate, relativeTime } from '@/lib/relativeTime';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_LINE_STRONG,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  SPACE_LG,
  SPACE_SM,
  SPACE_XS,
  TEXT_DISPLAY,
  TEXT_MD,
  TEXT_SM,
  WEIGHT_DISPLAY,
} from '@/theme';
import { useHasLiked, useToggleLike } from '../queries';

export const likesLabel = (count: number) => `${count} ${count === 1 ? 'Like' : 'Likes'}`;
export const commentsLabel = (count: number) => `${count} ${count === 1 ? 'Comment' : 'Comments'}`;

interface BuildHeaderProps {
  build: Build;
  /** The owner's controls (Edit, Delete), shown in the actions row. */
  ownerActions?: ReactNode;
}

/**
 * View mode's title pane (T22): the build's name (the page's `<h1>`), "by <author> · Level N · 3 days
 * ago", the like button (a count when signed out), the comment count (a link down to the comments,
 * T20), Report and the owner's controls on the right (under the name on narrow screens), and the
 * tags (each links to the builds with it).
 */
function BuildHeader({ build, ownerActions }: BuildHeaderProps) {
  const { uid } = useAuth();
  const owner = useUserProfile(build.ownerId);
  const liked = useHasLiked(build.id, uid);
  const toggleLike = useToggleLike(build.id, uid);
  const isLiked = liked.data === true;

  return (
    <Pane $hero aria-labelledby="build-title">
      <Title id="build-title">{build.name}</Title>
      <Meta>
        {owner.data ? (
          <span>
            by <AuthorLink to={`/user/${owner.data.id}`}>{owner.data.displayName}</AuthorLink>
          </span>
        ) : null}
        <span>
          Level <Strong>{build.level}</Strong>
        </span>
        <time dateTime={build.createdAt.toISOString()} title={formatFullDate(build.createdAt)}>
          {relativeTime(build.createdAt)}
        </time>
      </Meta>
      <Actions>
        {uid ? (
          <Button
            variant="secondary"
            aria-pressed={isLiked}
            disabled={toggleLike.isPending || liked.isPending}
            onClick={() => toggleLike.mutate(!isLiked)}>
            <Heart filled={isLiked} $liked={isLiked} />
            {likesLabel(build.likeCount)}
          </Button>
        ) : (
          <LikeCount>
            <Heart $liked={false} />
            {likesLabel(build.likeCount)}
          </LikeCount>
        )}
        <CommentsLink href="#comments-title">
          <CommentIcon />
          {commentsLabel(build.commentCount)}
        </CommentsLink>
        <ReportButton
          target={{ buildId: build.id }}
          authorId={build.ownerId}
          kind="build"
          align="center"
          appearance="button"
        />
        {ownerActions}
      </Actions>
      <ErrorMessage>{toggleLike.error ? errorMessage(toggleLike.error) : ''}</ErrorMessage>
      {build.tags.length ? (
        <Tags aria-label="Tags">
          {build.tags.map((tag) => (
            <li key={tag}>
              <TagLink to={`/?tag=${encodeURIComponent(tag)}`}>
                <Tag>{tag}</Tag>
              </TagLink>
            </li>
          ))}
        </Tags>
      ) : null}
    </Pane>
  );
}

// Name and meta on the left, actions on the right spanning both; tags and errors underneath.
// Tablets and phones: one column, actions under the meta line.
const Pane = styled(Frame)`
  align-items: center;
  column-gap: ${SPACE_LG};
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;

  & > * {
    grid-column: 1 / -1;
  }

  @media ${BELOW_TABLET} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Title = styled.h1`
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_DISPLAY};
  font-weight: ${WEIGHT_DISPLAY};
  line-height: 1.15;
  margin: 0;
  overflow-wrap: anywhere;
  text-wrap: balance;

  && {
    grid-column: 1;
  }

  @media ${BELOW_MOBILE} {
    font-size: 27px;
  }
`;

const Meta = styled.p`
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-wrap: wrap;
  font-size: ${TEXT_MD};
  gap: ${SPACE_XS} 18px;
  margin: ${SPACE_XS} 0 0;

  && {
    grid-column: 1;
  }
`;

const AuthorLink = styled(Link)`
  color: ${COLOR_TEXT};
  font-weight: 600;

  &:hover {
    color: ${COLOR_ACCENT_STRONG};
  }
`;

const Strong = styled.b`
  color: ${COLOR_TEXT};
  font-variant-numeric: tabular-nums;
`;

const Actions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  justify-content: flex-end;

  && {
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  @media ${BELOW_TABLET} {
    justify-content: flex-start;
    margin-top: ${SPACE_SM};

    && {
      grid-column: 1;
      grid-row: auto;
    }
  }
`;

// The accent only when you've liked it (the liked state is in the accent budget).
const Heart = styled(HeartIcon)<{ $liked: boolean }>`
  color: ${({ $liked }) => ($liked ? COLOR_ACCENT : COLOR_TEXT_MUTED)};
`;

const LikeCount = styled.span`
  align-items: center;
  display: inline-flex;
  font-size: ${TEXT_SM};
  font-weight: 600;
  gap: 8px;
  min-height: 44px;
  padding: 0 ${SPACE_SM};
`;

// A plain in-page link, sized like the signed-out like count.
const CommentsLink = styled.a`
  align-items: center;
  border: 1px solid transparent;
  color: ${COLOR_TEXT};
  display: inline-flex;
  font-size: ${TEXT_SM};
  font-weight: 600;
  gap: 8px;
  min-height: 44px;
  padding: 0 ${SPACE_SM};

  & > svg {
    color: ${COLOR_TEXT_MUTED};
  }

  &:hover {
    border-color: ${COLOR_LINE_STRONG};
    color: ${COLOR_ACCENT_STRONG};
  }
`;

const Tags = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: ${SPACE_XS} 0 0;
  padding: 0;
`;

// The tag stays small; the link's padding makes the tap target 44 px tall.
const TagLink = styled(Link)`
  align-items: center;
  display: inline-flex;
  min-height: 44px;

  &:hover > span {
    border-color: ${COLOR_TEXT_MUTED};
  }
`;

export default BuildHeader;
