import { useState } from 'react';
import { useMatch } from 'react-router';
import styled from 'styled-components';
import { TextLink } from '@/components/ui/TextButton';
import { CloseIcon } from '@/components/ui/icons';
import useAuth from '@/features/auth/useAuth';
import { useMediaQuery } from './useMediaQuery';
import { COLOR_LINE, COLOR_TEXT_MUTED, TEXT_SM } from '@/theme';

// Below this the header row has no room for the line.
const NARROW = '(max-width: 1199px)';
const STORAGE_KEY = 'sb-new-here-dismissed';

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * T70: a slim line under the header for signed-out visitors on build, weapon and tag pages, where most
 * people arrive from a shared link or a search: what the site is, and where to learn more or plan a build.
 * Dismissal is remembered in localStorage (the strip still works without it).
 */
function NewHereStrip({ place }: { place: 'header' | 'row' }) {
  // On wide windows the line sits in the header row (T70: a separate row would push the build page's
  // fold, `fold.spec`); below that it gets a row of its own under the header.
  const narrow = useMediaQuery(NARROW);
  const { loading, uid } = useAuth();
  const onLandingPage = [
    useMatch('/build/:buildId/*'),
    useMatch('/weapons/:slug'),
    useMatch('/tags/:slug'),
  ].some(Boolean);
  const [dismissed, setDismissed] = useState(wasDismissed);
  // /build/new is the planner itself: nothing to explain there.
  const isPlanner = useMatch('/build/new/*') !== null;

  if (loading || uid || dismissed || !onLandingPage || isPlanner) return null;
  if ((place === 'row') !== narrow) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Private mode or blocked storage: it just comes back next visit.
    }
  };

  return (
    <Strip $place={place} role="region" aria-label="About Souls Builds">
      <Text>
        {place === 'row' ? (
          <>
            <strong>Souls Builds</strong>: Elden Ring builds with a step-by-step route to every
            item.
          </>
        ) : (
          'Elden Ring builds with a step-by-step route to every item'
        )}
      </Text>
      <TextLink to="/">How it works</TextLink>
      {place === 'row' ? <TextLink to="/build/new">Plan your own</TextLink> : null}
      <Close type="button" aria-label="Dismiss" onClick={dismiss}>
        <CloseIcon />
      </Close>
    </Strip>
  );
}

const Strip = styled.div<{ $place: 'header' | 'row' }>`
  align-items: center;
  ${({ $place }) => ($place === 'header' ? 'white-space: nowrap;' : '')}
  border-bottom: ${({ $place }) => ($place === 'row' ? `1px solid ${COLOR_LINE}` : 'none')};
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-wrap: ${({ $place }) => ($place === 'header' ? 'nowrap' : 'wrap')};
  font-size: ${TEXT_SM};
  gap: 0 12px;
`;

const Text = styled.span`
  margin-right: auto;
  padding: 6px 0;

  strong {
    font-weight: 600;
  }
`;

const Close = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  height: 44px;
  justify-content: center;
  width: 44px;
`;

export default NewHereStrip;
