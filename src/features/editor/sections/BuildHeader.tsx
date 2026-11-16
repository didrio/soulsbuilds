import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import PageHero from '@/components/ui/PageHero';
import Tag from '@/components/ui/Tag';
import { HeartIcon } from '@/components/ui/icons';
import useAuth from '@/features/auth/useAuth';
import ReportButton from '@/features/reports/ReportButton';
import { useUserProfile } from '@/features/profile/queries';
import { errorMessage } from '@/lib/firebase';
import type { Build } from '@/lib/models';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_SM,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
} from '@/theme';
import { useHasLiked, useToggleLike } from '../queries';

export const likesLabel = (count: number) => `${count} ${count === 1 ? 'Like' : 'Likes'}`;

interface BuildHeaderProps {
  build: Build;
  /** The owner's controls (Edit, Delete), shown in the actions row. */
  ownerActions?: ReactNode;
}

/**
 * View mode's title block: the build's name, "by <author> · Level N", then the like button (a count
 * when signed out), Report, the owner's controls, and the tags (each links to the builds with it).
 */
function BuildHeader({ build, ownerActions }: BuildHeaderProps) {
  const { uid } = useAuth();
  const owner = useUserProfile(build.ownerId);
  const liked = useHasLiked(build.id, uid);
  const toggleLike = useToggleLike(build.id, uid);
  const isLiked = liked.data === true;

  return (
    <PageHero title={build.name}>
      <Meta>
        {owner.data ? (
          <span>
            by <AuthorLink to={`/user/${owner.data.id}`}>{owner.data.displayName}</AuthorLink>
          </span>
        ) : null}
        <span>
          Level <Strong>{build.level}</Strong>
        </span>
      </Meta>
      <Actions>
        {uid ? (
          <Button
            variant="secondary"
            aria-pressed={isLiked}
            disabled={toggleLike.isPending || liked.isPending}
            onClick={() => toggleLike.mutate(!isLiked)}>
            <Heart filled={isLiked} />
            {likesLabel(build.likeCount)}
          </Button>
        ) : (
          <LikeCount>
            <Heart />
            {likesLabel(build.likeCount)}
          </LikeCount>
        )}
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
    </PageHero>
  );
}

const Meta = styled.p`
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-wrap: wrap;
  font-size: ${TEXT_MD};
  gap: ${SPACE_XS} 18px;
  justify-content: center;
  margin: ${SPACE_SM} 0 18px;
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
  justify-content: center;
`;

const Heart = styled(HeartIcon)`
  color: ${COLOR_ACCENT};
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

const Tags = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  list-style: none;
  margin: ${SPACE_SM} 0 0;
  padding: 0;
`;

// The tag stays small; the link's padding makes the tap target 44 px tall.
const TagLink = styled(Link)`
  align-items: center;
  display: inline-flex;
  min-height: 44px;

  &:hover > span {
    border-color: ${COLOR_ACCENT};
    color: ${COLOR_TEXT};
  }
`;

export default BuildHeader;
