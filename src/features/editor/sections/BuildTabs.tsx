import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { NavLink } from 'react-router';
import styled from 'styled-components';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_ACCENT,
  COLOR_BG,
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  DURATION_FAST,
  SPACE_GUTTER,
  SPACE_SM,
  TEXT_BODY,
  TEXT_MD,
  TEXT_XS,
} from '@/theme';
import { loadRoute } from '../guide/GuideSection';
import { BUILD_TABS, tabLabel, tabPath, type BuildTab } from '../tabs';

/** The tab row's height (44 px buttons with 10 px above and below); the sticky stats column sits under it. */
export const TAB_BAR_HEIGHT = 64;
/** A tab's side padding: the row starts this far left, so the first label lines up with the page. */
const TAB_PADDING = 14;

interface BuildTabsProps {
  buildId: string;
  /** The build's name, for the slug in each tab's URL (T56). */
  buildName?: string;
  current: BuildTab;
  tabs: BuildTab[];
  /** Shown on the discussion tab: the build's stored comment count (the write-up isn't one). */
  commentCount?: number;
  /** The build has a write-up: the discussion tab says so ("Write-up & comments", T71). */
  hasWriteUp?: boolean;
  /** The build's actions (`BuildActions`: Track, Like, Share), on the right of the row (T66). */
  actions?: ReactNode;
}

/**
 * The build page's tab row (T28, T48; T66: the bottom of the top section): the tabs as links on the
 * left, so each tab has a URL and Back works, and the build's actions on the right, over one hairline
 * that ends the top section. It sticks to the top of the window while the page scrolls, so Track,
 * Like and Share stay in reach. When the tab
 * changes while the bar is stuck, the page scrolls so the bar sits at the top and the new tab starts
 * right under it; otherwise the scroll position stays. Pointing at Guide fetches the route's code and
 * data ahead of the click.
 */
function BuildTabs({
  buildId,
  buildName,
  current,
  tabs,
  commentCount,
  hasWriteUp = false,
  actions,
}: BuildTabsProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const previous = useRef(current);
  const stuck = useStuck(sentinel);

  useEffect(() => {
    if (previous.current === current) return;
    previous.current = current;
    const top = sentinel.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollTo(0, window.scrollY + top);
  }, [current]);

  return (
    <>
      <Sentinel ref={sentinel} aria-hidden="true" />
      <Row $stuck={stuck}>
        <Bar aria-label="Build sections">
          {BUILD_TABS.filter(({ tab }) => tabs.includes(tab)).map(({ tab }) => (
            <Tab
              key={tab}
              to={tabPath(buildId, tab, buildName)}
              end
              onFocus={tab === 'guide' ? () => void loadRoute() : undefined}
              onPointerEnter={tab === 'guide' ? () => void loadRoute() : undefined}>
              {tabLabel(tab, { hasWriteUp })}
              {tab === 'discussion' && commentCount !== undefined ? (
                <>
                  {/* A space for the accessible name ("Comments 3"); flex layout drops it visually. */}{' '}
                  <Count>{commentCount}</Count>
                </>
              ) : null}
            </Tab>
          ))}
        </Bar>
        {actions ? <Actions>{actions}</Actions> : null}
      </Row>
    </>
  );
}

/**
 * Whether the row is stuck to the window's top: the zero-height element right above it has scrolled
 * out of view. Until then the row is see-through, on the page's own background.
 */
function useStuck(sentinel: RefObject<HTMLElement | null>) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setStuck(entry.boundingClientRect.top < 0 && !entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [sentinel]);
  return stuck;
}

const Sentinel = styled.div`
  height: 0;
`;

// Sticks to the window's top (the header scrolls away); once stuck, on the page background so content
// passes under.
const Row = styled.div<{ $stuck: boolean }>`
  align-items: center;
  background: ${({ $stuck }) => ($stuck ? COLOR_BG : 'transparent')};
  /* The hairline as a shadow, so the current tab's accent line paints over it. */
  box-shadow: inset 0 -1px 0 ${COLOR_LINE};
  display: flex;
  gap: ${SPACE_SM};
  justify-content: space-between;
  min-height: ${TAB_BAR_HEIGHT}px;
  position: sticky;
  top: 0;
  z-index: 5;

  @media ${BELOW_MOBILE} {
    margin: 0 -${SPACE_GUTTER};
    padding: 0 8px;
  }
`;

const Bar = styled.nav`
  align-self: stretch;
  display: flex;
  gap: 4px;
  margin-left: -${TAB_PADDING}px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media ${BELOW_MOBILE} {
    gap: 2px;
    margin-left: 0;
  }
`;

// Right of the tabs; the like error (if any) hangs under the row.
const Actions = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  gap: ${SPACE_SM};
  position: relative;
`;

// Muted text; the current tab in the text color over a 2px accent line (on top of the row's hairline)
// as wide as its label, so the first tab's line starts at the page's edge like everything else.
const Tab = styled(NavLink)`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: inline-flex;
  flex: none;
  font-size: ${TEXT_BODY};
  font-weight: 500;
  gap: 8px;
  height: ${TAB_BAR_HEIGHT}px;
  padding: 0 ${TAB_PADDING}px;
  position: relative;
  transition: color ${DURATION_FAST} ease;

  &::after {
    bottom: 0;
    content: '';
    height: 2px;
    left: ${TAB_PADDING}px;
    position: absolute;
    right: ${TAB_PADDING}px;
  }

  &:hover {
    color: ${COLOR_TEXT};
  }

  &[aria-current='page'] {
    color: ${COLOR_TEXT};

    &::after {
      background: ${COLOR_ACCENT};
    }
  }

  @media ${BELOW_TABLET} {
    font-size: ${TEXT_MD};
    padding: 0 12px;
  }

  @media ${BELOW_MOBILE} {
    gap: 6px;
    padding: 0 9px;
  }
`;

const Count = styled.span`
  background: ${COLOR_SURFACE_RAISED};
  border-radius: 3px;
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1;
  padding: 4px 6px 5px;
`;

export default BuildTabs;
