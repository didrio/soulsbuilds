import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Frame from '@/components/ui/Frame';
import ItemTile from '@/components/ui/ItemTile';
import Tag from '@/components/ui/Tag';
import { HeartIcon } from '@/components/ui/icons';
import { getCardItem, iconUrl } from '@/data/core';
import useAuth from '@/features/auth/useAuth';
import ReportButton from '@/features/reports/ReportButton';
import { useUserProfile } from '@/features/profile/queries';
import { errorMessage } from '@/lib/firebase';
import { buildImage } from '@/lib/equipment';
import type { Build } from '@/lib/models';
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
  TEXT_DISPLAY,
  TEXT_MD,
  TEXT_SM,
  WEIGHT_DISPLAY,
} from '@/theme';
import { useHasLiked, useToggleLike } from '../queries';

export const likesLabel = (count: number) => `${count} ${count === 1 ? 'Like' : 'Likes'}`;

interface BuildHeaderProps {
  build: Build;
  /** The owner's controls (Edit, Delete), shown in the actions row. */
  ownerActions?: ReactNode;
  /** "Track this build" (T34): the first action. */
  trackAction?: ReactNode;
  /** The player's progress or "Build complete" (T34), beside the title on desktop. */
  progress?: ReactNode;
}

/**
 * View mode's hero (T22, T28): the build image (T40: the author's pick, else the main weapon) as a large tile with the skin's glow, the build's name
 * (the page's `<h1>`), "by <author> · Level N · 3 days ago", the tags (each links to the builds with
 * it), and the actions: Track this build (T34), Like (a count when signed out), Report and the
 * owner's controls. Desktop: actions on the right; tablets and phones: a smaller tile, the actions in
 * a row under the tags. While tracking, the progress takes the right column on desktop (the actions
 * move under the tags) and comes last on phones.
 */
function BuildHeader({ build, ownerActions, trackAction, progress }: BuildHeaderProps) {
  const { uid } = useAuth();
  const owner = useUserProfile(build.ownerId);
  const liked = useHasLiked(build.id, uid);
  const toggleLike = useToggleLike(build.id, uid);
  const isLiked = liked.data === true;
  const image = getCardItem(buildImage(build));

  return (
    <Pane $hero $tile={Boolean(image)} $progress={Boolean(progress)} aria-labelledby="build-title">
      {image ? <Portrait src={iconUrl(image.icon)} title={image.name} size={112} /> : null}
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
        <Players build={build} />
        <time dateTime={build.createdAt.toISOString()} title={formatFullDate(build.createdAt)}>
          {relativeTime(build.createdAt)}
        </time>
      </Meta>
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
      <Actions $progress={Boolean(progress)}>
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
        <ReportButton
          target={{ buildId: build.id }}
          authorId={build.ownerId}
          kind="build"
          align="center"
          appearance="button"
        />
        {ownerActions}
      </Actions>
      {progress}
      <Errors>
        <ErrorMessage>{toggleLike.error ? errorMessage(toggleLike.error) : ''}</ErrorMessage>
      </Errors>
    </Pane>
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

/** The hero's grid areas (desktop): the right column holds the actions, or the progress (T34). */
function desktopAreas(tile: boolean, progress: boolean) {
  const left = tile ? ['tile title', 'tile meta', 'tile tags'] : ['title', 'meta', 'tags'];
  const error = tile ? 'error error error' : 'error error';
  if (!progress) return [...left.map((row) => `'${row} actions'`), `'${error}'`].join(' ');
  const actions = tile ? 'tile actions' : 'actions';
  return [...left, actions].map((row) => `'${row} progress'`).join(' ') + ` '${error}'`;
}

// Desktop: the tile, then name / meta / tags, then the actions, top-aligned. Tablets and phones: the
// tile beside the name and meta, then the tags and the actions across the pane.
const Pane = styled(Frame)<{ $tile: boolean; $progress: boolean }>`
  align-items: center;
  column-gap: ${SPACE_LG};
  display: grid;
  grid-template-areas: ${({ $tile, $progress }) => desktopAreas($tile, $progress)};
  grid-template-columns: ${({ $tile }) =>
    $tile ? '112px minmax(0, 1fr) auto' : 'minmax(0, 1fr) auto'};
  grid-template-rows: ${({ $progress }) => ($progress ? 'auto auto auto 1fr' : 'auto auto 1fr')};
  padding: 24px;

  @media ${BELOW_TABLET} {
    column-gap: ${SPACE_MD};
    grid-template-areas: ${({ $tile }) =>
      $tile
        ? `'tile title' 'tile meta' 'tags tags' 'actions actions' 'progress progress' 'error error'`
        : `'title' 'meta' 'tags' 'actions' 'progress' 'error'`};
    grid-template-columns: ${({ $tile }) => ($tile ? '76px minmax(0, 1fr)' : 'minmax(0, 1fr)')};
    grid-template-rows: none;
    padding: ${SPACE_MD};
  }
`;

// The build image, lit by the skin's tint.
const Portrait = styled(ItemTile)`
  align-self: start;
  box-shadow: 0 0 48px ${COLOR_TINT};
  grid-area: tile;

  @media ${BELOW_TABLET} {
    height: 76px;
    width: 76px;
  }
`;

const Title = styled.h1`
  align-self: end;
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_DISPLAY};
  font-weight: ${WEIGHT_DISPLAY};
  grid-area: title;
  line-height: 1.15;
  margin: 0;
  overflow-wrap: anywhere;
  text-wrap: balance;

  @media ${BELOW_MOBILE} {
    font-size: 27px;
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
  margin: ${SPACE_XS} 0 0;
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

// Desktop: right-aligned in the right column, or (while tracking) left-aligned under the tags.
const Actions = styled.div<{ $progress: boolean }>`
  align-items: center;
  align-self: start;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  grid-area: actions;
  justify-content: ${({ $progress }) => ($progress ? 'flex-start' : 'flex-end')};
  margin-top: ${({ $progress }) => ($progress ? SPACE_SM : '0')};
  max-width: ${({ $progress }) => ($progress ? 'none' : '420px')};

  @media ${BELOW_TABLET} {
    justify-content: flex-start;
    max-width: none;
  }
`;

const Errors = styled.div`
  grid-area: error;
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
  margin: 2px 0 0;
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
