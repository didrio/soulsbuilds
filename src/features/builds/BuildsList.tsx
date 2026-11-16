import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { CommentIcon, HeartIcon } from '@/components/ui/icons';
import { selectionBar } from '@/components/ui/inWorld';
import ItemTile from '@/components/ui/ItemTile';
import Tag from '@/components/ui/Tag';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { getCardArmor, getCardWeapon, iconUrl } from '@/data/core';
import type { Build, UserProfile } from '@/lib/models';
import { formatFullDate, relativeTime } from '@/lib/relativeTime';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_ACCENT_STRONG,
  COLOR_FRAME,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  TEXT_LG,
  TEXT_SM,
  WEIGHT_DISPLAY,
} from '@/theme';
import { fitCount } from './tags';
import { labelText } from '@/components/ui/typography';

// Rows preview the first two slots of each hand (weapon slots 1, 2 main hand and 4, 5 off hand) and
// the four armor pieces, always in the same positions so the columns line up for scanning.
export const PREVIEW_WEAPONS = [0, 1, 3, 4] as const;
const ARMOR = [
  ['helm', 'head'],
  ['chest', 'chest'],
  ['gauntlet', 'arms'],
  ['leg', 'legs'],
] as const;

const TILE = 56;
const TILE_MOBILE = 38;
const GAP = 6;
// Fixed row heights (name, author, one line of tags; on tablets and phones the tiles go underneath).
const ROW_HEIGHT = 96;
const ROW_HEIGHT_TABLET = 156;
const ROW_HEIGHT_PHONE = 136;
const SLOTS_WIDTH = `${4 * TILE + 3 * GAP}px`;

interface BuildsListProps {
  builds: Build[];
  /** Author profiles by uid, to show "by …" (left out on a profile page, where it's one author). */
  authors?: Record<string, UserProfile>;
}

/**
 * Builds as full-width rows (one link each): name, author, age and tags; armaments and armor as item
 * tiles; level, likes and comments. Dense on purpose, so many builds fit on screen, and all the same height
 * (tags on one line, the rest as "+N").
 */
function BuildsList({ builds, authors }: BuildsListProps) {
  return (
    <div>
      <ListHead aria-hidden="true">
        <span>Build</span>
        <span>Armaments</span>
        <span>Armor</span>
        <End>Level</End>
        <End>Activity</End>
      </ListHead>
      <Rows>
        {builds.map((build) => {
          const { equipment } = build;
          const author = authors?.[build.ownerId];
          return (
            <li key={build.id}>
              <Row to={`/build/${build.id}`}>
                <Who>
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
                  <RowTags tags={build.tags} />
                </Who>
                <Slots>
                  <SlotGroup>
                    {PREVIEW_WEAPONS.map((index) => {
                      const weapon = getCardWeapon(equipment.weapons[index]);
                      return (
                        <Tile
                          key={index}
                          src={weapon ? iconUrl(weapon.icon) : null}
                          title={weapon?.name}
                          size={TILE}
                        />
                      );
                    })}
                  </SlotGroup>
                  <SlotGroup>
                    {ARMOR.map(([slot, armorSlot]) => {
                      const piece = getCardArmor(equipment[slot], armorSlot);
                      return (
                        <Tile
                          key={slot}
                          src={piece ? iconUrl(piece.icon) : null}
                          title={piece?.name}
                          size={TILE}
                        />
                      );
                    })}
                  </SlotGroup>
                </Slots>
                <Numbers>
                  <Level>
                    <VisuallyHidden>Level </VisuallyHidden>
                    {build.level}
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
    </div>
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

const columns = `minmax(0, 1fr) ${SLOTS_WIDTH} ${SLOTS_WIDTH} 70px 72px`;

const ListHead = styled.div`
  ${labelText}
  column-gap: 24px;
  display: grid;
  grid-template-columns: ${columns};
  padding: 0 16px 8px;

  @media ${BELOW_TABLET} {
    display: none;
  }
`;

const End = styled.span`
  text-align: right;
`;

const Rows = styled.ul`
  border-top: 1px solid ${COLOR_LINE};
  list-style: none;
  margin: 0;
  padding: 0;

  & > li {
    border-bottom: 1px solid ${COLOR_LINE};
  }
`;

const Row = styled(Link)`
  ${selectionBar}
  align-items: center;
  column-gap: 24px;
  display: grid;
  grid-template-columns: ${columns};
  height: ${ROW_HEIGHT}px;
  padding: 0 16px;
  position: relative;

  &:hover img {
    filter: drop-shadow(0 0 6px ${COLOR_FRAME});
  }

  @media ${BELOW_TABLET} {
    grid-template-areas:
      'who numbers'
      'slots slots';
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: 10px;
    column-gap: 12px;
    align-content: center;
    height: ${ROW_HEIGHT_TABLET}px;
  }

  @media ${BELOW_MOBILE} {
    height: ${ROW_HEIGHT_PHONE}px;
    padding: 0 4px;
  }
`;

const Who = styled.div`
  min-width: 0;

  @media ${BELOW_TABLET} {
    grid-area: who;
  }
`;

const Name = styled.span`
  color: ${COLOR_TEXT};
  display: block;
  font-family: ${FONT_DISPLAY};
  font-size: 19px;
  font-weight: ${WEIGHT_DISPLAY};
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${Row}:hover & {
    color: ${COLOR_ACCENT_STRONG};
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
  display: flex;
  gap: ${TAG_GAP}px;
  height: 22px;
  margin-top: 6px;
  overflow: hidden;
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

const More = styled(Tag)`
  color: ${COLOR_TEXT_MUTED};
  height: 22px;
`;

// Desktop: the two slot groups are grid columns of the row; tablet and phone: one line under the name.
const Slots = styled.div`
  display: contents;

  @media ${BELOW_TABLET} {
    display: flex;
    gap: 10px;
    grid-area: slots;
  }

  @media ${BELOW_MOBILE} {
    gap: 8px;
  }
`;

const SlotGroup = styled.div`
  display: flex;
  gap: ${GAP}px;

  @media ${BELOW_MOBILE} {
    gap: 4px;
  }
`;

const Tile = styled(ItemTile)`
  @media ${BELOW_MOBILE} {
    height: ${TILE_MOBILE}px;
    width: ${TILE_MOBILE}px;
  }
`;

// Desktop: two grid columns; tablet and phone: stacked at the top right.
const Numbers = styled.div`
  display: contents;

  @media ${BELOW_TABLET} {
    align-items: flex-end;
    align-self: start;
    display: flex;
    flex-direction: column;
    gap: 2px;
    grid-area: numbers;
  }
`;

const Level = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_LG};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  text-align: right;
`;

// Likes over comments (T20); on tablets and phones side by side, under the level.
const Activity = styled.span`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media ${BELOW_TABLET} {
    flex-direction: row;
    gap: 10px;
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

  & > svg {
    color: ${COLOR_TEXT_MUTED};
  }
`;

export default BuildsList;
