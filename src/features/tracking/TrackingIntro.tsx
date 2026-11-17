import type { ReactNode } from 'react';
import styled from 'styled-components';
import { useOpenAuthDialog, type AuthDialogKind } from '@/app/authDialog';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { CheckIcon, DevicesIcon, LevelUpIcon, PinIcon } from '@/components/ui/icons';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_LINE,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  TEXT_MD,
  TEXT_SM,
} from '@/theme';
import type { BuildTracking } from './useBuildTracking';

const POINTS: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <CheckIcon size={18} />,
    title: 'Check off gear as you find it',
    text: 'Every weapon, armor piece, talisman and spell on the build.',
  },
  {
    icon: <LevelUpIcon size={18} />,
    title: 'Level your stats toward the build’s',
    text: 'Your level next to each target, ticked when you reach it.',
  },
  {
    icon: <PinIcon size={18} />,
    title: 'Always know your next stop',
    text: 'The route marks what you’ve done and where to go next.',
  },
  {
    icon: <DevicesIcon size={18} />,
    title: 'Your progress on every device',
    text: 'Saved to your account and private to you, so your phone by the console has it too.',
  },
];

/**
 * What tracking is (T41), before the first "Track this build": signed out, it invites the visitor to
 * create an account or log in, and tracking starts once they're in; signed in (no build tracked yet),
 * "Start tracking".
 */
export function TrackingIntro({
  tracking,
  onClose,
  onStarted,
}: {
  tracking: BuildTracking;
  onClose: () => void;
  /** Once tracking has started (or the account already tracked the build): opens the How to get tab. */
  onStarted: () => void;
}) {
  const openAuthDialog = useOpenAuthDialog();
  const signIn = (kind: AuthDialogKind) => {
    onClose();
    openAuthDialog(kind, (uid) => void tracking.startAfterSignIn(uid).then(onStarted));
  };

  return (
    <Dialog title="Track this build" onClose={onClose} width={480}>
      <Points>
        {POINTS.map((point) => (
          <Point key={point.title}>
            <Icon>{point.icon}</Icon>
            <span>
              <strong>{point.title}</strong>
              <Muted>{point.text}</Muted>
            </span>
          </Point>
        ))}
      </Points>
      <Footer>
        {tracking.signedIn ? null : <Note>Tracking needs a free account.</Note>}
        <Actions>
          {tracking.signedIn ? (
            <>
              <Button
                onClick={() => {
                  onClose();
                  tracking.start();
                  onStarted();
                }}>
                <CheckIcon />
                Start tracking
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Not now
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => signIn('signup')}>Create account</Button>
              <Button variant="secondary" onClick={() => signIn('login')}>
                Log in
              </Button>
            </>
          )}
        </Actions>
      </Footer>
    </Dialog>
  );
}

const Points = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${SPACE_MD};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Point = styled.li`
  display: flex;
  font-size: ${TEXT_MD};
  gap: ${SPACE_GROUP};

  strong {
    display: block;
    font-weight: 600;
  }
`;

const Icon = styled.span`
  align-items: center;
  border: 1px solid ${COLOR_LINE};
  border-radius: 50%;
  color: ${COLOR_ACCENT};
  display: flex;
  flex: none;
  height: 34px;
  justify-content: center;
  width: 34px;
`;

const Muted = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: block;
  font-size: ${TEXT_SM};
  margin-top: 2px;
`;

const Footer = styled.div`
  border-top: 1px solid ${COLOR_LINE};
  display: flex;
  flex-direction: column;
  gap: ${SPACE_SM};
  margin-top: ${SPACE_LG};
  padding-top: ${SPACE_MD};
`;

const Note = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};

  @media ${BELOW_MOBILE} {
    flex-direction: column;
  }
`;
