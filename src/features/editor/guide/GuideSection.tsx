import { lazy, Suspense } from 'react';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import SectionHeading from '@/components/ui/SectionHeading';
import type { Equipment } from '@/lib/models';
import { COLOR_TEXT_MUTED, SPACE_MD, SPACE_SM, TEXT_SM } from '@/theme';
import { DashedTile, SolidTile } from './GuideTiles';

// The route needs the ~400 KB acquisition data: its own chunk, fetched when the tab opens (or when the
// reader points at a link to it: `loadRoute` is the prefetch).
export const loadRoute = () => import('./GuideRoute');
const GuideRoute = lazy(loadRoute);

/** Whether the build has any item to find (no route otherwise). */
export const hasItems = (equipment: Equipment) =>
  Object.values(equipment).some((value) =>
    Array.isArray(value) ? value.some((item) => item !== null) : value !== null,
  );

/**
 * The How to get tab (T28): what the route is, a legend for its tiles, and the route itself
 * (`GuideRoute`, loaded with its data on the tab's first open).
 */
function GuideSection({ equipment }: { equipment: Equipment }) {
  const items = hasItems(equipment);
  return (
    <Frame aria-labelledby="guide-title">
      <SectionHeading id="guide-title">How to get this build</SectionHeading>
      {items ? (
        <>
          <Intro>
            <Hint>
              A sensible order through the usual progression, from a fresh save. Not a walkthrough:
              upgrade materials and runes aren’t included.
            </Hint>
            <Legend aria-hidden="true">
              <SolidTile $size={20} /> in this build
              <DashedTile $size={20} /> other items
            </Legend>
          </Intro>
          <Suspense fallback={<LoadingAnimation size={30} />}>
            <GuideRoute equipment={equipment} />
          </Suspense>
        </>
      ) : (
        <Hint>This build has no items yet, so there’s nothing to find.</Hint>
      )}
    </Frame>
  );
}

const Intro = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} ${SPACE_MD};
  justify-content: space-between;
  margin-bottom: ${SPACE_MD};
`;

const Hint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  flex: 1 1 320px;
  font-size: ${TEXT_SM};
  margin: 0;
  max-width: 560px;
`;

const Legend = styled.p`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  font-size: ${TEXT_SM};
  gap: 8px;
  margin: 0;
  white-space: nowrap;

  & > :nth-child(2) {
    margin-left: 8px;
  }
`;

export default GuideSection;
