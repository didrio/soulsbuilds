import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { CommentIcon, HeartIcon } from '@/components/ui/icons';
import { selectionBar } from '@/components/ui/inWorld';
import ItemTile from '@/components/ui/ItemTile';
import Tag from '@/components/ui/Tag';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
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
const GAP = 4;
const PORTRAIT = 72;
const PORTRAIT_PHONE = 60;
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
}

/**
 * Builds as full-width rows (one link each): the build image (T40) as a portrait, name, author, age and tags;
 * a strip of item tiles (hands, then armor); level, likes and comments. Dense on purpose, so many builds
 * fit on screen, and all the same height on desktop (tags on one line, the rest as "+N").
 */
function BuildsList({ builds, authors }: BuildsListProps) {
  return (
    <Rows>
      {builds.map((build) => {
        const { equipment } = build;
        const author = authors?.[build.ownerId];
        const main = getCardItem(buildImage(build));
        return (
          <li key={build.id}>
            <Row to={`/build/${build.id}`}>
              <Portrait
                src={main ? iconUrl(main.icon) : null}
                title={main?.name}
                size={PORTRAIT}
                placeholder
              />
              <Head>
                <Name>{build.name}</Name>
                <Meta>
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
                </Meta>
              </Head>
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
              <Numbers>
                <Level>
                  <LevelLabel>Level</LevelLabel> <LevelNumber>{build.level}</LevelNumber>
                </Level>
                <Activity>
                  <Likes>
                    <HeartIcon size={15} />
                    {build.likeCount}
                    <VisuallyHidden> {build.likeCount === 1 ? 'like' : 'likes'}</VisuallyHidden>
                  </Likes>
                  <Comments>
                    <CommentIcon size={14} />
                    {build.commentCount}
                    <VisuallyHidden>
                      {' '}
                      {build.commentCount === 1 ? 'comment' : 'comments'}
                    </VisuallyHidden>
                  </Comments>
                </Activity>
              </Numbers>
            </Row>
          </li>
        );
      })}
    </Rows>
  );
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

// One grid for every width, by named areas: desktop is portrait | name over tags | strip | level |
// likes and comments; tablets move the numbers to the right and the strip underneath; phones stack.
const Row = styled(Link)`
  ${selectionBar}
  align-content: center;
  column-gap: 20px;
  display: grid;
  grid-template-areas:
    'portrait head strip level activity'
    'portrait tags strip level activity';
  grid-template-columns: ${PORTRAIT}px minmax(0, 1fr) ${STRIP_WIDTH} 56px 84px;
  grid-template-rows: auto auto;
  height: ${ROW_HEIGHT}px;
  padding: 0 16px;
  position: relative;

  &:hover img {
    filter: drop-shadow(0 0 6px ${COLOR_FRAME});
  }

  @media ${BELOW_TABLET} {
    column-gap: 14px;
    grid-template-areas:
      'portrait head numbers'
      'portrait tags numbers'
      'strip strip strip';
    grid-template-columns: ${PORTRAIT}px minmax(0, 1fr) auto;
    height: ${ROW_HEIGHT_TABLET}px;
    row-gap: 0;
  }

  @media ${BELOW_MOBILE} {
    grid-template-areas:
      'portrait head'
      'portrait numbers'
      'tags tags'
      'strip strip';
    grid-template-columns: ${PORTRAIT_PHONE}px minmax(0, 1fr);
    height: auto;
    padding: 12px 4px;
  }
`;

const Portrait = styled(ItemTile)`
  align-self: center;
  grid-area: portrait;

  @media ${BELOW_MOBILE} {
    align-self: start;
    height: ${PORTRAIT_PHONE}px;
    width: ${PORTRAIT_PHONE}px;
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
  font-size: 20px;
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

  & > b {
    color: ${COLOR_TEXT};
    font-weight: 500;
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

  /* Phones: no empty line between the numbers and the strip. */
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
    height: ${TILE}px;
    width: ${TILE}px;
  }
`;

// Desktop: two grid columns (level, then likes over comments); tablets: stacked at the top right;
// phones: one line under the name.
const Numbers = styled.div`
  display: contents;

  @media ${BELOW_TABLET} {
    align-items: flex-end;
    align-self: start;
    display: flex;
    flex-direction: column;
    gap: 4px;
    grid-area: numbers;
  }

  @media ${BELOW_MOBILE} {
    align-items: center;
    align-self: start;
    flex-direction: row;
    gap: 14px;
  }
`;

const Level = styled.span`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  grid-area: level;
  text-align: right;

  @media ${BELOW_MOBILE} {
    align-items: baseline;
    flex-direction: row;
    gap: 6px;
  }
`;

const LevelLabel = styled.span`
  ${labelText}
`;

const LevelNumber = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_LG};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

// Likes over comments (T20); on tablets and phones side by side.
const Activity = styled.span`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 4px;
  grid-area: activity;

  @media ${BELOW_TABLET} {
    flex-direction: row;
    gap: 10px;
    grid-area: auto;
  }
`;

const Likes = styled.span`
  align-items: center;
  color: ${COLOR_TEXT};
  display: inline-flex;
  font-size: ${TEXT_SM};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  gap: 5px;
  justify-content: flex-end;

  & > svg {
    color: ${COLOR_TEXT_MUTED};
  }
`;

const Comments = styled(Likes)`
  color: ${COLOR_TEXT_MUTED};
  font-weight: 500;
`;

export default BuildsList;
