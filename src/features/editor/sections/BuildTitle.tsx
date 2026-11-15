import { Link } from 'react-router';
import styled from 'styled-components';
import ErrorMessage from '@/components/ui/ErrorMessage';
import FlexGroup from '@/components/ui/FlexGroup';
import Tag from '@/components/ui/Tag';
import useAuth from '@/features/auth/useAuth';
import ReportButton from '@/features/reports/ReportButton';
import { useUserProfile } from '@/features/profile/queries';
import { errorMessage } from '@/lib/firebase';
import type { Build } from '@/lib/models';
import {
  COLOR_GOLD,
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_LIGHTEST_GREEN,
  FONT_BODY,
  FONT_DISPLAY,
  SPACE_GUTTER,
  SPACE_MD,
  SPACE_SM,
  SPACE_XL,
  SPACE_XS,
} from '@/theme';
import { useHasLiked, useToggleLike } from '../queries';

export const likesLabel = (count: number) => `${count} ${count === 1 ? 'Like' : 'Likes'}`;

/** View mode header: build name, "Created by", and the like button (a counter when signed out). */
function BuildTitle({ build }: { build: Build }) {
  const { uid } = useAuth();
  const owner = useUserProfile(build.ownerId);
  const liked = useHasLiked(build.id, uid);
  const toggleLike = useToggleLike(build.id, uid);
  const isLiked = liked.data === true;

  return (
    <TitleContainer vertical>
      <Name>{build.name}</Name>
      {owner.data ? (
        <CreatedByContainer>
          Created by
          <CreatedBy to={`/user/${owner.data.id}`}>{owner.data.displayName}</CreatedBy>
        </CreatedByContainer>
      ) : null}
      <LikesContainer vertical>
        {uid ? (
          <LikeButton
            type="button"
            aria-pressed={isLiked}
            disabled={toggleLike.isPending || liked.isPending}
            onClick={() => toggleLike.mutate(!isLiked)}
            $liked={isLiked}>
            {isLiked ? '♥ ' : '♡ '}
            {likesLabel(build.likeCount)}
          </LikeButton>
        ) : (
          <Tag>{likesLabel(build.likeCount)}</Tag>
        )}
        <ErrorMessage>{toggleLike.error ? errorMessage(toggleLike.error) : ''}</ErrorMessage>
        <ReportButton
          target={{ buildId: build.id }}
          authorId={build.ownerId}
          kind="build"
          align="center"
        />
      </LikesContainer>
    </TitleContainer>
  );
}

const TitleContainer = styled(FlexGroup)`
  margin-bottom: ${SPACE_XL};
  max-width: 100%;
  padding: 0 ${SPACE_GUTTER};
`;

const Name = styled.h1`
  font-size: 40px;
  font-weight: normal;
  text-align: center;
  margin: ${SPACE_SM} 0;
  overflow-wrap: anywhere;
  font-family: ${FONT_DISPLAY};
  text-shadow: 0px 0px 4px ${COLOR_GOLD};
  color: ${COLOR_LIGHTEST_GREEN};
`;

const CreatedByContainer = styled(FlexGroup)`
  justify-content: center;
  gap: ${SPACE_XS};
`;

const CreatedBy = styled(Link)`
  color: ${COLOR_LIGHTEST_GREEN};
  font-weight: bold;
`;

const LikesContainer = styled(FlexGroup)`
  align-items: center;
  gap: 8px;
  margin-top: ${SPACE_MD};
`;

const LikeButton = styled.button<{ $liked: boolean }>`
  background-color: ${({ $liked }) => ($liked ? COLOR_LIGHT_GREEN : COLOR_GREEN)};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  color: ${({ $liked }) => ($liked ? COLOR_LIGHTEST_GREEN : 'inherit')};
  cursor: pointer;
  font-family: ${FONT_BODY};
  font-size: 14px;
  height: 30px;
  padding: 0 12px;

  &:hover:enabled {
    background-color: ${COLOR_LIGHT_GREEN};
    color: ${COLOR_LIGHTEST_GREEN};
  }

  &:disabled {
    cursor: progress;
  }

  &:focus-visible {
    outline: 2px solid ${COLOR_GOLD};
  }
`;

export default BuildTitle;
