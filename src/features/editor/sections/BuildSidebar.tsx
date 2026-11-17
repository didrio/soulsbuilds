import { useEffect, useRef, useState, type RefObject } from 'react';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import SectionHeading from '@/components/ui/SectionHeading';
import { useAppSelector } from '@/app/hooks';
import {
  BELOW_TABLET,
  COLOR_LINE,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_MD,
  TEXT_SM,
} from '@/theme';
import { gearGroups } from '../gear';
import { selectGearState } from '../store/derived';
import { TAB_BAR_HEIGHT } from './BuildTabs';
import { GearRow } from './GearTiles';
import StatsCard from './StatsCard';

/** Where the sidebar sticks: under the tab bar, with a little air. */
const STICKY_TOP = TAB_BAR_HEIGHT + 16;
/** Room kept under it, to the window's edge. */
const ROOM_BELOW = 16;

/**
 * Whether the element fits in the window below `top` with `below` to spare, so it can stick without
 * its bottom ever being out of reach. Measured again when it or the window changes size.
 */
function useFitsWindow(ref: RefObject<HTMLElement | null>, top: number, below: number) {
  const [fits, setFits] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setFits(element.offsetHeight + top + below <= window.innerHeight);
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [ref, top, below]);
  return fits;
}

/**
 * The build in a sidebar (T48, the owner's design): the stats (`StatsCard`: rune level, starting
 * class, attributes with bars and talisman bonuses, HP / FP / stamina, equip load, poise), then, on
 * the Guide and Discussion tabs, the equipment as small icon tiles by group (`gear.ts`), so it's there
 * at a glance. On the Equipment tab (T63) the equipment is the tab itself: the sidebar is the stats
 * alone, as tall as the Equipment panel beside it, its blocks spread to fill it. Desktop: a 312 px
 * column that sticks under the tab bar when it fits the window. Editing (Equipment tab only): the
 * stats take inputs.
 */
function BuildSidebar({
  editable,
  level,
  equipment,
  fill = false,
}: {
  editable: boolean;
  level: number;
  /** Show the equipment under the stats (Guide, Discussion). */
  equipment: boolean;
  /** As tall as the Equipment panel beside it (viewing the Equipment tab), the stats spread out. */
  fill?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const fits = useFitsWindow(ref, STICKY_TOP, ROOM_BELOW);
  const groups = gearGroups(useAppSelector(selectGearState), false);

  return (
    <Aside
      ref={ref}
      as="aside"
      aria-label={equipment ? 'Stats and equipment' : 'Stats'}
      $sticky={equipment && fits}
      $fill={fill}>
      <StatsCard editable={editable} level={level} fill={fill} />
      {equipment ? (
        <Gear aria-labelledby="gear-title">
          <SectionHeading id="gear-title">Equipment</SectionHeading>
          {groups.length ? (
            <Groups>
              {groups.map((group) => (
                <GearRow key={group.key} group={group} editable={false} />
              ))}
            </Groups>
          ) : (
            <Empty>No items yet.</Empty>
          )}
        </Gear>
      ) : null}
    </Aside>
  );
}

// Filling its row: a column, so the stats can stretch to the Equipment panel's height.
const Aside = styled(Frame)<{ $sticky: boolean; $fill: boolean }>`
  align-self: ${({ $fill }) => ($fill ? 'stretch' : 'start')};
  display: ${({ $fill }) => ($fill ? 'flex' : 'block')};
  flex-direction: column;
  min-width: 0;
  position: ${({ $sticky }) => ($sticky ? 'sticky' : 'static')};
  top: ${STICKY_TOP}px;

  @media ${BELOW_TABLET} {
    position: static;
  }
`;

const Gear = styled.section`
  border-top: 1px solid ${COLOR_LINE};
  margin-top: ${SPACE_MD};
  padding-top: ${SPACE_MD};

  h2 {
    margin-bottom: ${SPACE_GROUP};
  }
`;

const Groups = styled.div`
  display: grid;
  gap: ${SPACE_GROUP};
`;

const Empty = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
`;

export default BuildSidebar;
