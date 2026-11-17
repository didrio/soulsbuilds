import { useEffect, useRef } from 'react';
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
  TEXT_XS,
} from '@/theme';
import { loadRoute } from '../guide/GuideSection';
import { BUILD_TABS, tabPath, type BuildTab } from '../tabs';

/** The tab bar's height; the sticky stats column sits under it. */
export const TAB_BAR_HEIGHT = 48;

interface BuildTabsProps {
  buildId: string;
  current: BuildTab;
  tabs: BuildTab[];
  /** Shown on the Comments tab (the build's stored count). */
  commentCount?: number;
}

/**
 * The build page's tab bar (T28, T48): links, so each tab has a URL and Back works, across the page
 * with the labels centered. It sticks to the top of the window while the page scrolls. When the tab
 * changes while the bar is stuck, the page scrolls so the bar sits at the top and the new tab starts
 * right under it; otherwise the scroll position stays. Pointing at Guide fetches the route's code and
 * data ahead of the click.
 */
function BuildTabs({ buildId, current, tabs, commentCount }: BuildTabsProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const previous = useRef(current);

  useEffect(() => {
    if (previous.current === current) return;
    previous.current = current;
    const top = sentinel.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollTo(0, window.scrollY + top);
  }, [current]);

  return (
    <>
      <Sentinel ref={sentinel} aria-hidden="true" />
      <Bar aria-label="Build sections">
        {BUILD_TABS.filter(({ tab }) => tabs.includes(tab)).map(({ tab, label }) => (
          <Tab
            key={tab}
            to={tabPath(buildId, tab)}
            end
            onFocus={tab === 'guide' ? () => void loadRoute() : undefined}
            onPointerEnter={tab === 'guide' ? () => void loadRoute() : undefined}>
            {label}
            {tab === 'comments' && commentCount !== undefined ? (
              <>
                {/* A space for the accessible name ("Comments 3"); flex layout drops it visually. */}{' '}
                <Count>{commentCount}</Count>
              </>
            ) : null}
          </Tab>
        ))}
      </Bar>
    </>
  );
}

const Sentinel = styled.div`
  height: 0;
`;

// Sticks to the window's top (the header scrolls away), on the page background so content passes under.
const Bar = styled.nav`
  background: ${COLOR_BG};
  border-bottom: 1px solid ${COLOR_LINE};
  display: flex;
  gap: 4px;
  justify-content: center;
  overflow-x: auto;
  position: sticky;
  scrollbar-width: none;
  top: 0;
  z-index: 5;

  &::-webkit-scrollbar {
    display: none;
  }

  @media ${BELOW_MOBILE} {
    gap: 2px;
    margin: 0 -${SPACE_GUTTER};
    padding: 0 8px;
  }
`;

// Muted text; the current tab in the text color over a 2px accent line (on top of the bar's hairline).
const Tab = styled(NavLink)`
  align-items: center;
  border-bottom: 2px solid transparent;
  color: ${COLOR_TEXT_MUTED};
  display: inline-flex;
  flex: none;
  font-size: 15px;
  font-weight: 500;
  gap: 8px;
  height: ${TAB_BAR_HEIGHT}px;
  margin-bottom: -1px;
  padding: 0 16px;
  transition: color ${DURATION_FAST} ease;

  &:hover {
    color: ${COLOR_TEXT};
  }

  &[aria-current='page'] {
    border-bottom-color: ${COLOR_ACCENT};
    color: ${COLOR_TEXT};
  }

  @media ${BELOW_TABLET} {
    font-size: 14px;
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
  padding: 1px 6px;
`;

export default BuildTabs;
