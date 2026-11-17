import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ItemTile from '@/components/ui/ItemTile';
import PageHead from '@/components/ui/PageHead';
import Tag from '@/components/ui/Tag';
import { HeartIcon } from '@/components/ui/icons';
import { getCardItem, getCardWeapon, iconUrl } from '@/data/core';
import useAuth from '@/features/auth/useAuth';
import ReportButton from '@/features/reports/ReportButton';
import { useUserProfile } from '@/features/profile/queries';
import { errorMessage } from '@/lib/firebase';
import { buildImage } from '@/lib/equipment';
import { tagHref, weaponLinks } from '@/lib/hubs';
import type { Build } from '@/lib/models';
import { shareMeta, SITE_ORIGIN } from '@/lib/share';
import { formatFullDate, relativeTime } from '@/lib/relativeTime';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  COLOR_TINT,
  FONT_DISPLAY,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  SPACE_XS,
  TEXT_XXL,
  TEXT_MD,
  TEXT_SM,
  WEIGHT_DISPLAY,
} from '@/theme';
import { useHasLiked, useToggleLike } from '../queries';
import ShareButton from './ShareButton';

/** The build image's edge on desktop (T48: from 112; T66: as tall as the name, byline and tags), and below 900 px. */
const TILE = 88;
const TILE_SMALL = 56;

export const likesLabel = (count: number) => `${count} ${count === 1 ? 'Like' : 'Likes'}`;

interface BuildHeaderProps {
  build: Build;
  /** The owner's controls (Edit, Delete), beside Report. */
  ownerActions?: ReactNode;
  /**
   * Phones and tablets: the build's actions (`BuildActions`), first in the row under the tags. On
   * desktop they sit on the tab row instead (T66), so this is left out.
   */
  actions?: ReactNode;
}

/**
 * View mode's title block (T22, T28, T48; unframed since T66, the top of the page's top section): the
 * build image (T40: the author's pick, else the main weapon) as an 88 px tile with the skin's glow, the
 * build's name (the page's `<h1>`), "by <author> · with <weapons> · Level N · 3 days ago", the tags
 * (each links to its tag page), and the quieter controls: Report and the owner's Edit and Delete,
 * top right on desktop. Track, Like and Share are `BuildActions`, on the tab row (desktop) or passed
 * in as `actions` (tablets and phones: a smaller tile, everything in a row under the tags).
 */
function BuildHeader({ build, ownerActions, actions }: BuildHeaderProps) {
  const owner = useUserProfile(build.ownerId);
  const image = getCardItem(buildImage(build));
  // T55: each weapon links to its page ("with Rivers of Blood and Uchigatana"); at most three.
  const weapons = weaponLinks(build.equipment.weapons).slice(0, 3);
  // The tab's title, description and canonical (T51): the same text the link-preview function writes.
  const meta = shareMeta({
    name: build.name,
    level: build.level,
    author: owner.data?.displayName ?? 'a player',
    description: build.description,
    weapons: build.equipment.weapons.flatMap((weapon) =>
      weapon === null ? [] : [getCardWeapon(weapon)?.name ?? []].flat(),
    ),
  });

  return (
    <Pane $tile={Boolean(image)} aria-labelledby="build-title">
      <PageHead {...meta} canonical={`${SITE_ORIGIN}/build/${build.id}`} />
      {image ? <Portrait src={iconUrl(image.icon)} title={image.name} size={TILE} /> : null}
      <Title id="build-title">{build.name}</Title>
      <Meta>
        {owner.data ? (
          <span>
            by <AuthorLink to={`/user/${owner.data.id}`}>{owner.data.displayName}</AuthorLink>
          </span>
        ) : null}
        {weapons.length ? (
          <span>
            with{' '}
            {weapons.map(({ name, path }, index) => (
              <Fragment key={path}>
                {index === 0 ? '' : index === weapons.length - 1 ? ' and ' : ', '}
                <AuthorLink to={path}>{name}</AuthorLink>
              </Fragment>
            ))}
          </span>
        ) : null}
        <span>
          Level <Strong>{build.level}</Strong>
        </span>
        <Players build={build} />
        <time dateTime={build.createdAt.toISOString()} title={formatFullDate(build.createdAt)}>
          {relativeTime(build.createdAt)}
        </time>
      </Meta>
      {build.tags.length ? (
        <Tags aria-label="Tags">
          {build.tags.map((tag) => (
            <li key={tag}>
              <TagLink to={tagHref(tag)}>
                <Tag>{tag}</Tag>
              </TagLink>
            </li>
          ))}
        </Tags>
      ) : null}
      <Tools>
        {actions}
        <ReportButton
          target={{ buildId: build.id }}
          authorId={build.ownerId}
          kind="build"
          align="start"
          appearance="button"
        />
        {ownerActions}
      </Tools>
    </Pane>
  );
}

/**
 * The build's actions (T66: on the desktop tab row, beside the tabs; under the tags on phones): Track
 * this build (T34; "Tracking" while tracking, T46), Like (a count when signed out) and Share (T54).
 */
export function BuildActions({ build, trackAction }: { build: Build; trackAction?: ReactNode }) {
  const { uid } = useAuth();
  const owner = useUserProfile(build.ownerId);
  const liked = useHasLiked(build.id, uid);
  const toggleLike = useToggleLike(build.id, uid);
  const isLiked = liked.data === true;
  return (
    <>
      {trackAction}
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
      <ShareButton build={build} author={owner.data?.displayName} />
      {toggleLike.error ? (
        <LikeError>
          <ErrorMessage>{errorMessage(toggleLike.error)}</ErrorMessage>
        </LikeError>
      ) : null}
    </>
  );
}

/**
 * "37 playing · 12 finished" (T36): from the build's counters (playing = tracking it, not finished).
 * Each part only when it isn't zero; nothing for a build nobody tracks.
 */
function Players({ build }: { build: Pick<Build, 'playerCount' | 'finishedCount'> }) {
  const finished = build.finishedCount;
  const playing = Math.max(0, build.playerCount - finished);
  const parts = [
    playing ? ([playing, 'playing'] as const) : null,
    finished ? ([finished, 'finished'] as const) : null,
  ].filter((part) => part !== null);
  if (!parts.length) return null;
  return (
    <span>
      {parts.map(([count, label], index) => (
        <span key={label}>
          {index ? ' · ' : null}
          <Strong>{count}</Strong> {label}
        </span>
      ))}
    </span>
  );
}

// Desktop: the tile, then name / meta / tags, with Report and the owner's controls top right (their
// forms open under them). Tablets and phones: the tile beside the name and meta, then the tags and
// every action in a row across.
const Pane = styled.section<{ $tile: boolean }>`
  align-items: center;
  column-gap: ${SPACE_LG};
  display: grid;
  grid-template-areas: ${({ $tile }) =>
    $tile
      ? `'tile title tools' 'tile meta tools' 'tile tags tools'`
      : `'title tools' 'meta tools' 'tags tools'`};
  grid-template-columns: ${({ $tile }) =>
    $tile ? `${TILE}px minmax(0, 1fr) auto` : 'minmax(0, 1fr) auto'};
  grid-template-rows: auto auto 1fr;

  @media ${BELOW_TABLET} {
    column-gap: ${SPACE_MD};
    grid-template-areas: ${({ $tile }) =>
      $tile
        ? `'tile title' 'tile meta' 'tags tags' 'tools tools'`
        : `'title' 'meta' 'tags' 'tools'`};
    grid-template-columns: ${({ $tile }) =>
      $tile ? `${TILE_SMALL}px minmax(0, 1fr)` : 'minmax(0, 1fr)'};
    grid-template-rows: none;
  }
`;

// The build image, lit by the skin's tint.
const Portrait = styled(ItemTile)`
  align-self: start;
  box-shadow: 0 0 48px ${COLOR_TINT};
  grid-area: tile;

  @media ${BELOW_TABLET} {
    height: ${TILE_SMALL}px;
    width: ${TILE_SMALL}px;
  }
`;

const Title = styled.h1`
  align-self: end;
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_XXL};
  font-weight: ${WEIGHT_DISPLAY};
  grid-area: title;
  line-height: 1.15;
  margin: 0;
  overflow-wrap: anywhere;
  text-wrap: balance;

  @media ${BELOW_MOBILE} {
    font-size: 1.625rem;
  }
`;

const Meta = styled.p`
  align-self: start;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-wrap: wrap;
  font-size: ${TEXT_MD};
  gap: ${SPACE_XS} 14px;
  grid-area: meta;
  margin: 2px 0 0;
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

// Desktop: right-aligned in the right column. Phones: every action, in a row under the tags.
const Tools = styled.div`
  align-items: center;
  align-self: start;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  grid-area: tools;
  justify-content: flex-end;
  max-width: 420px;

  &:empty {
    display: none;
  }

  @media ${BELOW_TABLET} {
    justify-content: flex-start;
    max-width: none;
  }
`;

// Desktop: under the tab row's buttons, so the row keeps its height; phones: a line of its own.
const LikeError = styled.div`
  position: absolute;
  right: 0;
  top: 100%;

  @media ${BELOW_TABLET} {
    flex-basis: 100%;
    position: static;
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

const Tags = styled.ul`
  align-self: start;
  display: flex;
  flex-wrap: wrap;
  gap: 0 6px;
  grid-area: tags;
  list-style: none;
  margin: -${SPACE_XS} 0 -${SPACE_SM};
  padding: 0;

  /* Phones: the second row of tags keeps its distance from the actions. */
  @media ${BELOW_TABLET} {
    margin-bottom: ${SPACE_SM};
  }
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
