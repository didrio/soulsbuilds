import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { HeartIcon } from '@/components/ui/icons';
import { selectionBar } from '@/components/ui/inWorld';
import ItemTile from '@/components/ui/ItemTile';
import Tag from '@/components/ui/Tag';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { tabPath } from '@/features/editor/tabs';
import { buildImage } from '@/lib/equipment';
import { getCardArmor, getCardItem, getCardWeapon, iconUrl } from '@/data/core';
import type { Build, UserProfile } from '@/lib/models';
import { formatFullDate, relativeTime } from '@/lib/relativeTime';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_ACCENT_STRONG,
  COLOR_FRAME,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  TEXT_LG,
  TEXT_MD,
  TEXT_NAME,
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
 * Builds as full-width rows (one link each), a ranked feed (T74): likes first, large, in a rail (none
 * yet: a quiet outline heart); the build image (T40) as a portrait; name, then author, age, comments
 * and players (counts only when there are some), then tags; a strip of item tiles (hands, then armor);
 * the level, small. Dense on purpose, so many builds fit on screen, and all the same height on
 * desktop (tags on one line, the rest as "+N").
 */
function BuildsList({ builds, authors, compact = false }: BuildsListProps) {
  return (
    <Rows>
      {builds.map((build) => {
        const { equipment } = build;
        const author = authors?.[build.ownerId];
        const main = getCardItem(buildImage(build));
        return (
          <li key={build.id}>
            <Row to={tabPath(build.id, 'equipment', build.name)} $compact={compact}>
              <Rail $zero={build.likeCount === 0}>
                <HeartIcon size={18} filled={build.likeCount > 0} />
                {build.likeCount > 0 ? (
                  <>
                    <LikeCount>{build.likeCount}</LikeCount>
                    <VisuallyHidden> {build.likeCount === 1 ? 'like' : 'likes'}</VisuallyHidden>
                  </>
                ) : (
                  <VisuallyHidden>No likes yet</VisuallyHidden>
                )}
              </Rail>
              <Portrait
                src={main ? iconUrl(main.icon) : null}
                title={main?.name}
                size={compact ? PORTRAIT_COMPACT : PORTRAIT}
                placeholder
                $compact={compact}
              />
              <Head>
                <Name>{build.name}</Name>
                <Meta>
                  <MetaLevel $always={compact}>
                    Lv <b>{build.level}</b>
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
                    <VisuallyHidden>Level</VisuallyHidden> <LevelNumber>{build.level}</LevelNumber>
                  </Level>
                </>
              )}
            </Row>
          </li>
        );
      })}
    </Rows>
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
 * A row's tags on one line: as many as fit, then "+N". The rest stay in the link's accessible name
 * (visually hidden, still measured), so they can come back when the row gets wider.
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

  & > li {
    border-bottom: 1px solid ${COLOR_LINE};
  }
`;

// One grid for every width, by named areas: desktop is likes | portrait | name over tags | strip |
// level; tablets move the strip underneath; phones stack, with the level in the meta line.
const Row = styled(Link)<{ $compact: boolean }>`
  ${selectionBar}
  align-content: center;
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

const Rail = styled.span<{ $zero: boolean }>`
  align-items: center;
  align-self: center;
  color: ${({ $zero }) => ($zero ? COLOR_LINE_STRONG : COLOR_TEXT_MUTED)};
  display: flex;
  flex-direction: column;
  gap: 2px;
  grid-area: rail;

  @media ${BELOW_MOBILE} {
    align-self: start;
    padding-top: 8px;
  }
`;

const LikeCount = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_LG};
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

const Name = styled.span`
  color: ${COLOR_TEXT};
  display: block;
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_NAME};
  font-weight: ${WEIGHT_DISPLAY};
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${Row}:hover & {
    color: ${COLOR_ACCENT_STRONG};
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

  & > b {
    font-variant-numeric: tabular-nums;
  }

  @media ${BELOW_MOBILE} {
    display: inline;
  }
`;

const Dot = styled.span`
  margin: 0 6px;
`;

// Always there (empty too) and one line tall, so every row has the same height.
const Tags = styled.span`
  align-self: start;
  display: flex;
  gap: ${TAG_GAP}px;
  grid-area: tags;
  height: 22px;
  margin-top: 6px;
  overflow: hidden;
  position: relative;

  @media ${BELOW_MOBILE} {
    &:empty {
      display: none;
    }
  }
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

const More = styled(Tag)`
  color: ${COLOR_TEXT_MUTED};
  height: 22px;
`;

const Strip = styled.span`
  align-items: center;
  display: flex;
  gap: ${GAP}px;
  grid-area: strip;

  @media ${BELOW_TABLET} {
    margin-top: 10px;
  }
`;

const Divider = styled.span`
  align-self: stretch;
  background: ${COLOR_LINE_STRONG};
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

const LevelNumber = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_MD};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

export default BuildsList;
