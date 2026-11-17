import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import LevelNumber from '@/components/ui/LevelNumber';
import styled from 'styled-components';
import { HeartIcon } from '@/components/ui/icons';
import { selectionBar } from '@/components/ui/inWorld';
import ItemTile from '@/components/ui/ItemTile';
import Tag from '@/components/ui/Tag';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import useAuth from '@/features/auth/useAuth';
import { useLikedIds, useToggleLike } from '@/features/editor/queries';
import { tabPath } from '@/features/editor/tabs';
import { buildImage } from '@/lib/equipment';
import { getCardArmor, getCardItem, getCardWeapon, iconUrl } from '@/data/core';
import type { Build, UserProfile } from '@/lib/models';
import { formatFullDate, relativeTime } from '@/lib/relativeTime';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_FRAME,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  DURATION_FAST,
  FONT_DISPLAY,
  RADIUS_FRAME,
  TEXT_MD,
  TEXT_NAME_ROW,
  TEXT_SM,
  WEIGHT_DISPLAY,
} from '@/theme';
import { fitCount } from './tags';
import { labelText } from '@/components/ui/typography';

// Rows preview the first two slots of each hand, left hand first (weapon slots 4, 5, then 1, 2), and
// the four armor pieces, always in the same cells so the strips line up for scanning (empty = faint).
export const PREVIEW_WEAPONS = [3, 4, 0, 1] as const;
const ARMOR = [
  ['helm', 'head'],
  ['chest', 'chest'],
  ['gauntlet', 'arms'],
  ['leg', 'legs'],
] as const;

const TILE = 38;
const TILE_PHONE = 32;
const GAP = 4;
const PORTRAIT = 72;
const PORTRAIT_PHONE = 56;
const PORTRAIT_COMPACT = 48;
const ROW_HEIGHT_COMPACT = 68;
// The heart in the likes column (T79: from 18).
const HEART = 22;
// The likes column (T74).
const RAIL = 44;
const RAIL_PHONE = 36;
// Fixed row heights on desktop and tablets (name, author, one line of tags; the strip goes underneath
// on tablets). Phones size to their content: names may take two lines.
const ROW_HEIGHT = 88;
const ROW_HEIGHT_TABLET = 140;
// 8 tiles, the gaps around them, and the divider with 6px of air on each side.
const STRIP_WIDTH = `${8 * TILE + 8 * GAP + 13}px`;

interface BuildsListProps {
  builds: Build[];
  /** Author profiles by uid, to show "by …" (left out on a profile page, where it's one author). */
  authors?: Record<string, UserProfile>;
  /** A home shelf's short rows (T74): likes, portrait, name, and the level in the meta line. */
  compact?: boolean;
}

/**
 * Builds as full-width rows, a ranked feed (T74): likes first, large, in a rail; the build image (T40)
 * as a portrait; name, then author, age, comments and players (counts only when there are some), then
 * tags ("No tags" when there are none, T79); a strip of item tiles (hands, then armor); the level, in its
 * band's color (T79). Dense on purpose, so many builds fit on screen, and all the same height on desktop
 * (tags on one line, the rest as "+N"). The name is the row's link, stretched over the whole row; the
 * heart sits above it and, signed in, likes or unlikes the build (T79).
 */
function BuildsList({ builds, authors, compact = false }: BuildsListProps) {
  const { uid } = useAuth();
  const likedIds = useLikedIds(uid).data;
  return (
    <Rows>
      {builds.map((build) => {
        const { equipment } = build;
        const author = authors?.[build.ownerId];
        const main = getCardItem(buildImage(build));
        return (
          <Row key={build.id} $compact={compact}>
            <LikeRail build={build} uid={uid} liked={likedIds?.has(build.id) ?? false} />
            <Portrait
              src={main ? iconUrl(main.icon) : null}
              title={main?.name}
              size={compact ? PORTRAIT_COMPACT : PORTRAIT}
              placeholder
              $compact={compact}
            />
            <Head>
              <Name to={tabPath(build.id, 'equipment', build.name)}>{build.name}</Name>
              <Meta>
                <MetaLevel $always={compact}>
                  Lv <LevelNumber level={build.level} />
                  <Dot aria-hidden="true">·</Dot>
                </MetaLevel>
                {author ? (
                  <>
                    by <b>{author.displayName}</b>
                    <Dot aria-hidden="true">·</Dot>
                  </>
                ) : null}
                <time
                  dateTime={build.createdAt.toISOString()}
                  title={formatFullDate(build.createdAt)}>
                  {relativeTime(build.createdAt)}
                </time>
                {activity(build).map((part) => (
                  <span key={part}>
                    <Dot aria-hidden="true">·</Dot>
                    {part}
                  </span>
                ))}
              </Meta>
            </Head>
            {compact ? null : (
              <>
                <RowTags tags={build.tags} />
                <Strip data-testid="slots">
                  {PREVIEW_WEAPONS.map((index) => {
                    const weapon = getCardWeapon(equipment.weapons[index]);
                    return (
                      <Tile
                        key={index}
                        src={weapon ? iconUrl(weapon.icon) : null}
                        title={weapon?.name}
                        size={TILE}
                        placeholder
                      />
                    );
                  })}
                  <Divider aria-hidden="true" />
                  {ARMOR.map(([slot, armorSlot]) => {
                    const piece = getCardArmor(equipment[slot], armorSlot);
                    return (
                      <Tile
                        key={slot}
                        src={piece ? iconUrl(piece.icon) : null}
                        title={piece?.name}
                        size={TILE}
                        placeholder
                      />
                    );
                  })}
                </Strip>
                <Level>
                  <LevelLabel aria-hidden="true">Lv</LevelLabel>
                  <VisuallyHidden>Level</VisuallyHidden> <LevelValue level={build.level} legend />
                </Level>
              </>
            )}
          </Row>
        );
      })}
    </Rows>
  );
}

/**
 * The likes rail (T79): a gold heart, filled once the build has any likes (outlined: none yet), and the
 * count. Signed in, a button that likes or unlikes, above the row's link; your like shows as the count in
 * gold. Signed out, the same heart, not interactive. The count moves at once and settles when the list
 * refetches.
 */
function LikeRail({ build, uid, liked }: { build: Build; uid: string | null; liked: boolean }) {
  const toggle = useToggleLike(build.id, uid);
  // What this row added since the list was read; cleared when a fresh count arrives.
  const [delta, setDelta] = useState(0);
  const [seenCount, setSeenCount] = useState(build.likeCount);
  if (seenCount !== build.likeCount) {
    setSeenCount(build.likeCount);
    setDelta(0);
  }
  const count = Math.max(0, build.likeCount + delta);
  const figure =
    count > 0 ? (
      <>
        <LikeCount>{count}</LikeCount>
        <VisuallyHidden> {count === 1 ? 'like' : 'likes'}</VisuallyHidden>
      </>
    ) : (
      <VisuallyHidden>No likes yet</VisuallyHidden>
    );

  if (!uid) {
    return (
      <Rail $zero={count === 0}>
        <HeartIcon size={HEART} filled={count > 0} />
        {figure}
      </Rail>
    );
  }
  return (
    <Rail
      $zero={count === 0}
      as="button"
      type="button"
      aria-pressed={liked}
      aria-label={`Like ${build.name}${count > 0 ? `, ${count} ${count === 1 ? 'like' : 'likes'}` : ''}`}
      disabled={toggle.isPending}
      onClick={() => {
        setDelta((d) => d + (liked ? -1 : 1));
        toggle.mutate(!liked, { onError: () => setDelta(0) });
      }}
      $button>
      <HeartIcon size={HEART} filled={count > 0} />
      {count > 0 ? (
        <LikeCount aria-hidden="true" $yours={liked}>
          {count}
        </LikeCount>
      ) : null}
    </Rail>
  );
}

/** "3 comments", "2 playing": only the counts there are (T74: zero is quiet). */
export function activity({
  commentCount,
  playerCount,
}: Pick<Build, 'commentCount' | 'playerCount'>) {
  const parts: string[] = [];
  if (commentCount > 0)
    parts.push(`${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`);
  if (playerCount > 0) parts.push(`${playerCount} playing`);
  return parts;
}

const TAG_GAP = 6;
/** Room kept for the "+N" chip (two digits at most in practice). */
const MORE_WIDTH = 34;

/**
 * A row's tags on one line: as many as fit, then "+N". The rest stay readable to screen readers
 * (visually hidden, still measured), so they can come back when the row gets wider. None: a grey "No
 * tags" chip (T79), so a row without tags doesn't look broken.
 */
function RowTags({ tags }: { tags: string[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(tags.length);

  useLayoutEffect(() => {
    const line = ref.current;
    if (!line) return;
    const measure = () => {
      const widths = [...line.querySelectorAll<HTMLElement>('[data-tag]')].map(
        (chip) => chip.offsetWidth,
      );
      setShown(fitCount(widths, line.clientWidth, TAG_GAP, MORE_WIDTH));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(line);
    return () => observer.disconnect();
  }, [tags]);

  const more = tags.length - shown;
  if (tags.length === 0) {
    return (
      <Tags>
        <NoTags>No tags</NoTags>
      </Tags>
    );
  }
  return (
    <Tags ref={ref}>
      {tags.map((tag, index) => (
        <TagChip key={tag} data-tag="" $hidden={index >= shown}>
          {tag}
        </TagChip>
      ))}
      {more > 0 ? <More aria-hidden="true">+{more}</More> : null}
    </Tags>
  );
}

const Rows = styled.ul`
  border-top: 1px solid ${COLOR_LINE};
  list-style: none;
  margin: 0;
  padding: 0;
`;

// One grid for every width, by named areas: desktop is likes | portrait | name over tags | strip |
// level; tablets move the strip underneath; phones stack, with the level in the meta line. The name's
// link covers the row (T79), so the hover and focus look belong to the row.
const Row = styled.li<{ $compact: boolean }>`
  ${selectionBar}
  &:focus-within:has(a:focus-visible) {
    outline: 2px solid ${COLOR_ACCENT_STRONG};
    outline-offset: -2px;
  }
  align-content: center;
  border-bottom: 1px solid ${COLOR_LINE};
  column-gap: 18px;
  display: grid;
  grid-template-areas:
    'rail portrait head strip level'
    'rail portrait tags strip level';
  grid-template-columns: ${RAIL}px ${PORTRAIT}px minmax(0, 1fr) ${STRIP_WIDTH} 44px;
  grid-template-rows: auto auto;
  height: ${ROW_HEIGHT}px;
  padding: 0 16px 0 8px;
  position: relative;

  &:hover img {
    filter: drop-shadow(0 0 6px ${COLOR_FRAME});
  }

  @media ${BELOW_TABLET} {
    column-gap: 14px;
    grid-template-areas:
      'rail portrait head level'
      'rail portrait tags level'
      'rail strip strip strip';
    grid-template-columns: ${RAIL}px ${PORTRAIT}px minmax(0, 1fr) auto;
    height: ${ROW_HEIGHT_TABLET}px;
    row-gap: 0;
  }

  @media ${BELOW_MOBILE} {
    column-gap: 12px;
    grid-template-areas:
      'rail portrait head'
      'rail portrait tags'
      'rail strip strip';
    grid-template-columns: ${RAIL_PHONE}px ${PORTRAIT_PHONE}px minmax(0, 1fr);
    height: auto;
    padding: 14px 4px 14px 0;
  }

  /* A home shelf (T74): one line of likes, portrait and name over meta, at every width. */
  && {
    ${({ $compact }) =>
      $compact
        ? `
    column-gap: 12px;
    grid-template-areas: 'rail portrait head';
    grid-template-columns: ${RAIL_PHONE}px ${PORTRAIT_COMPACT}px minmax(0, 1fr);
    grid-template-rows: auto;
    height: auto;
    min-height: ${ROW_HEIGHT_COMPACT}px;
    padding: 8px 8px 8px 0;
  `
        : ''}
  }
`;

// The hearts are always gold (T79, the owner's call; in the accent budget as "the liked state").
const Rail = styled.span<{ $button?: boolean; $zero: boolean }>`
  align-items: center;
  align-self: center;
  background: none;
  border: none;
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_ACCENT};
  display: flex;
  flex-direction: column;
  font: inherit;
  gap: 2px;
  grid-area: rail;
  justify-content: center;
  min-height: 44px;
  padding: 4px 0;
  position: relative;
  z-index: 2;
  /* No likes yet: the outlined heart a little dimmer (T79). */
  & > svg {
    opacity: ${({ $zero }) => ($zero ? 0.55 : 1)};
  }
  ${({ $button }) =>
    $button
      ? `
  cursor: pointer;
  &:hover > svg {
    transform: scale(1.12);
  }
  & > svg {
    transition: transform ${DURATION_FAST};
  }
  &:disabled {
    cursor: progress;
  }
  `
      : ''}

  @media ${BELOW_MOBILE} {
    align-self: start;
    padding-top: 8px;
  }
`;

// Your own like: the count in gold too (T79; the heart's fill means "has likes", for everyone).
const LikeCount = styled.span<{ $yours?: boolean }>`
  color: ${({ $yours }) => ($yours ? COLOR_ACCENT : COLOR_TEXT)};
  font-size: ${TEXT_MD};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1.1;
`;

const Portrait = styled(ItemTile)<{ $compact: boolean }>`
  align-self: center;
  grid-area: portrait;

  @media ${BELOW_MOBILE} {
    ${({ $compact }) =>
      $compact
        ? ''
        : `
    align-self: start;
    height: ${PORTRAIT_PHONE}px;
    width: ${PORTRAIT_PHONE}px;
    `}
  }
`;

const Head = styled.div`
  align-self: end;
  grid-area: head;
  min-width: 0;

  @media ${BELOW_MOBILE} {
    align-self: start;
  }
`;

const Name = styled(Link)`
  color: ${COLOR_TEXT};
  display: block;
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_NAME_ROW};
  font-weight: ${WEIGHT_DISPLAY};
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${Row}:hover & {
    color: ${COLOR_ACCENT_STRONG};
  }

  &:focus-visible {
    outline: none;
  }

  /* The whole row is the link (T79); the heart and the level sit above it. */
  &::after {
    content: '';
    inset: 0;
    position: absolute;
    z-index: 1;
  }

  @media ${BELOW_MOBILE} {
    -webkit-box-orient: vertical;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    white-space: normal;
  }
`;

const Meta = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: block;
  font-size: ${TEXT_SM};
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  & b {
    color: ${COLOR_TEXT};
    font-weight: 500;
  }

  @media ${BELOW_MOBILE} {
    white-space: normal;
  }
`;

// Phones show the level here; wider screens in its own column.
const MetaLevel = styled.span<{ $always: boolean }>`
  display: ${({ $always }) => ($always ? 'inline' : 'none')};

  & > span {
    font-weight: 600;
  }

  @media ${BELOW_MOBILE} {
    display: inline;
  }
`;

const Dot = styled.span`
  margin: 0 6px;
`;

// Always there and one line tall, so every row has the same height.
const Tags = styled.span`
  align-self: start;
  display: flex;
  gap: ${TAG_GAP}px;
  grid-area: tags;
  height: 22px;
  margin-top: 6px;
  overflow: hidden;
  pointer-events: none; /* clicks reach the row's link (T79) */
  position: relative;
`;

// Tags that don't fit are taken out of the line but kept measurable and readable to screen readers.
const TagChip = styled(Tag)<{ $hidden: boolean }>`
  height: 22px;
  ${({ $hidden }) =>
    $hidden &&
    `
    clip-path: inset(50%);
    left: 0;
    position: absolute;
  `}
`;

const NoTags = styled(Tag)`
  border-color: ${COLOR_LINE};
  color: ${COLOR_TEXT_MUTED};
  height: 22px;
`;

const More = styled(Tag)`
  color: ${COLOR_TEXT_MUTED};
  height: 22px;
`;

// Under the row's link (T79): clicks open the build.
const Strip = styled.span`
  align-items: center;
  pointer-events: none;
  display: flex;
  gap: ${GAP}px;
  grid-area: strip;

  @media ${BELOW_TABLET} {
    margin-top: 10px;
  }
`;

const Divider = styled.span`
  align-self: stretch;
  background: ${COLOR_LINE};
  flex: none;
  margin: 6px 6px;
  width: 1px;
`;

const Tile = styled(ItemTile)`
  @media ${BELOW_MOBILE} {
    height: ${TILE_PHONE}px;
    width: ${TILE_PHONE}px;
  }
`;

const Level = styled.span`
  align-items: flex-end;
  align-self: center;
  display: flex;
  flex-direction: column;
  grid-area: level;
  line-height: 1.2;
  text-align: right;

  @media ${BELOW_TABLET} {
    align-self: start;
    padding-top: 4px;
  }

  @media ${BELOW_MOBILE} {
    display: none;
  }
`;

const LevelLabel = styled.span`
  ${labelText}
`;

const LevelValue = styled(LevelNumber)`
  font-size: ${TEXT_MD};
  font-weight: 600;
  z-index: 2;
`;

export default BuildsList;
