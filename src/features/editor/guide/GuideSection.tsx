import { lazy, Suspense, useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import Frame from '@/components/ui/Frame';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import SectionHeading from '@/components/ui/SectionHeading';
import type { Equipment } from '@/lib/models';
import { COLOR_TEXT_MUTED, SPACE_MD, SPACE_SM, TEXT_SM } from '@/theme';

// The route needs the ~400 KB acquisition data: its own chunk, fetched when the reader asks for it
// (or points at the button, so it's usually there by the click).
const loadRoute = () => import('./GuideRoute');
const GuideRoute = lazy(loadRoute);

/** Whether the build has any item to find (the section is left out otherwise). */
export const hasItems = (equipment: Equipment) =>
  Object.values(equipment).some((value) =>
    Array.isArray(value) ? value.some((item) => item !== null) : value !== null,
  );

/**
 * "How to get this build" on the build page (T22: collapsed by default): the heading, what the route
 * is, and a Show/Hide button; the route itself (`GuideRoute`) loads on the first Show.
 */
function GuideSection({ equipment }: { equipment: Equipment }) {
  const [open, setOpen] = useState(false);
  if (!hasItems(equipment)) return null;

  return (
    <Frame aria-labelledby="guide-title">
      <SectionHeading id="guide-title">How to get this build</SectionHeading>
      <Intro>
        <Hint>
          A sensible order through the usual progression, from a fresh save. Not a walkthrough:
          upgrade materials and runes aren’t included.
        </Hint>
        <Button
          variant="secondary"
          aria-expanded={open}
          aria-controls="guide-route"
          onFocus={() => void loadRoute()}
          onPointerEnter={() => void loadRoute()}
          onClick={() => setOpen(!open)}>
          {open ? 'Hide the route' : 'Show the route'}
        </Button>
      </Intro>
      <div id="guide-route">
        {open ? (
          <Route>
            <Suspense fallback={<LoadingAnimation size={30} />}>
              <GuideRoute equipment={equipment} />
            </Suspense>
          </Route>
        ) : null}
      </div>
    </Frame>
  );
}

const Intro = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} ${SPACE_MD};
  justify-content: space-between;
`;

const Hint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  flex: 1 1 320px;
  font-size: ${TEXT_SM};
  margin: 0;
`;

const Route = styled.div`
  margin-top: ${SPACE_MD};
`;

export default GuideSection;
