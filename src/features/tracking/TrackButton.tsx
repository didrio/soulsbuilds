import { useState } from 'react';
import { useNavigate } from 'react-router';
import Button, { ButtonLink } from '@/components/ui/Button';
import { CheckIcon } from '@/components/ui/icons';
import { TrackingIntro } from './TrackingIntro';
import type { BuildTracking } from './useBuildTracking';

/**
 * "Track this build": the build page's primary action (T34). Signed out, or signed in with no build
 * tracked yet, it opens the intro first (T41); otherwise it starts at once. Either way the How to get
 * tab opens once tracking starts, since that's where tracking lives (T46). While tracking, a quiet
 * "Tracking" link to that tab.
 */
export function TrackButton({
  tracking,
  guidePath,
}: {
  tracking: BuildTracking;
  guidePath: string;
}) {
  const navigate = useNavigate();
  const [intro, setIntro] = useState(false);
  if (tracking.loading) return null;
  if (tracking.state) {
    return (
      <ButtonLink to={guidePath} variant="secondary">
        <CheckIcon />
        Tracking
      </ButtonLink>
    );
  }
  const openGuide = () => void navigate(guidePath);
  const showIntro = !tracking.signedIn || tracking.firstTime;
  return (
    <>
      <Button
        onClick={
          showIntro
            ? () => setIntro(true)
            : () => {
                tracking.start();
                openGuide();
              }
        }>
        <CheckIcon />
        Track this build
      </Button>
      {intro ? (
        <TrackingIntro tracking={tracking} onClose={() => setIntro(false)} onStarted={openGuide} />
      ) : null}
    </>
  );
}
