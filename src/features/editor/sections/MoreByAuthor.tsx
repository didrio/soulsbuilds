import { Link } from 'react-router';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import { HeartIcon } from '@/components/ui/icons';
import ItemTile from '@/components/ui/ItemTile';
import SectionHeading from '@/components/ui/SectionHeading';
import { TextLink } from '@/components/ui/TextButton';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { getCardWeapon, iconUrl } from '@/data/core';
import { PREVIEW_WEAPONS } from '@/features/builds/BuildsList';
import { useUserBuilds } from '@/features/builds/queries';
import { useUserProfile } from '@/features/profile/queries';
import { relativeTime } from '@/lib/relativeTime';
import {
  BELOW_TABLET,
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_FRAME,
  COLOR_GLOW,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  SPACE_MD,
  SPACE_SM,
  TEXT_MD,
  TEXT_SM,
} from '@/theme';

const SHOWN = 3;

/**
 * View mode, after the comments (T20): up to three of the author's other builds, most liked first, as
 * compact cards, and a link to their profile when there are more. Nothing while loading or when the
 * author has no other builds.
 */
function MoreByAuthor({ buildId, ownerId }: { buildId: string; ownerId: string }) {
  const builds = useUserBuilds(ownerId);
  const owner = useUserProfile(ownerId);
  const others = (builds.data ?? [])
    .filter((build) => build.id !== buildId)
    .sort((a, b) => b.likeCount - a.likeCount);
  if (!others.length || !owner.data) return null;
  const name = owner.data.displayName;

  return (
    <Frame aria-labelledby="more-by-title">
      <SectionHeading id="more-by-title">{`More by ${name}`}</SectionHeading>
      <Cards>
        {others.slice(0, SHOWN).map((build) => (
          <li key={build.id}>
            <Card to={`/build/${build.id}`}>
              <Name>{build.name}</Name>
              <Tiles>
                {PREVIEW_WEAPONS.map((index) => {
                  const weapon = getCardWeapon(build.equipment.weapons[index]);
                  return (
                    <ItemTile
                      key={index}
                      src={weapon ? iconUrl(weapon.icon) : null}
                      title={weapon?.name}
                      size={36}
                    />
                  );
                })}
              </Tiles>
              <CardMeta>
                <span>Level {build.level}</span>
                <span>
                  <Likes>
                    <HeartIcon size={13} />
                    {build.likeCount}
                    <VisuallyHidden> {build.likeCount === 1 ? 'like' : 'likes'}</VisuallyHidden>
                  </Likes>
                  <time dateTime={build.createdAt.toISOString()}>
                    {relativeTime(build.createdAt)}
                  </time>
                </span>
              </CardMeta>
            </Card>
          </li>
        ))}
      </Cards>
      {others.length > SHOWN ? (
        <All>
          <TextLink to={`/user/${ownerId}`}>{`All builds by ${name} →`}</TextLink>
        </All>
      ) : null}
    </Frame>
  );
}

const Cards = styled.ul`
  display: grid;
  gap: ${SPACE_SM};
  grid-template-columns: repeat(${SHOWN}, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;

  @media ${BELOW_TABLET} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Card = styled(Link)`
  border: 1px solid ${COLOR_LINE};
  display: grid;
  gap: ${SPACE_SM};
  height: 100%;
  padding: ${SPACE_SM} ${SPACE_MD};

  &:hover {
    background: ${COLOR_GLOW};
    border-color: ${COLOR_FRAME};
  }
`;

const Name = styled.span`
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_MD};
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${Card}:hover & {
    color: ${COLOR_ACCENT_STRONG};
  }
`;

const Tiles = styled.span`
  display: flex;
  gap: 4px;
`;

const CardMeta = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  font-size: ${TEXT_SM};
  font-variant-numeric: tabular-nums;
  gap: ${SPACE_SM};
  justify-content: space-between;

  & > span {
    display: inline-flex;
    gap: ${SPACE_SM};
  }
`;

const Likes = styled.span`
  align-items: center;
  display: inline-flex;
  gap: 4px;

  & > svg {
    color: ${COLOR_ACCENT};
  }
`;

const All = styled.p`
  font-size: ${TEXT_SM};
  margin: ${SPACE_MD} 0 0;
  text-align: center;
`;

export default MoreByAuthor;
