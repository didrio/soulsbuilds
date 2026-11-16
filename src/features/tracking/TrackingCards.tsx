import { useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import { useOpenAuthDialog } from '@/app/authDialog';
import {
  BELOW_MOBILE,
  COLOR_ACCENT_LINE,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_SM,
  TEXT_MD,
} from '@/theme';
import { panel } from '@/components/ui/inWorld';
import { keepProgressLater, setKeepProgressLater } from './localTracking';
import type { BuildTracking } from './useBuildTracking';

/**
 * Signed out, once there's something to keep (an item collected): progress lives in this browser, and
 * an account keeps it everywhere. "Keep my progress" opens sign-up (the progress moves into the new
 * account); "Later" hides the card until the browser session ends.
 */
export function KeepProgressCard({ tracking }: { tracking: BuildTracking }) {
  const openAuthDialog = useOpenAuthDialog();
  const [later, setLater] = useState(keepProgressLater);
  const { state, progress, signedIn } = tracking;
  if (signedIn || later || !state || !progress || progress.complete || !state.collected.length) {
    return null;
  }
  return (
    <Card aria-label="Keep your progress">
      <Text>
        <strong>Your progress is saved in this browser.</strong>{' '}
        <Muted>Create an account to keep it on every device, like your phone by the console.</Muted>
      </Text>
      <Actions>
        <Button onClick={() => openAuthDialog('signup')}>Keep my progress</Button>
        <Button
          variant="ghost"
          onClick={() => {
            setKeepProgressLater();
            setLater(true);
          }}>
          Later
        </Button>
      </Actions>
    </Card>
  );
}

/** "2 new items since you started": items the author added after the player started tracking. */
export function NewItemsNotice({ tracking }: { tracking: BuildTracking }) {
  const count = tracking.newItems.length;
  if (!tracking.state || count === 0) return null;
  return (
    <Notice role="status">
      <Text>
        <strong>{count === 1 ? '1 new item' : `${count} new items`} since you started.</strong>{' '}
        <Muted>The author changed the build; the new items are unchecked.</Muted>
      </Text>
      <Button variant="secondary" onClick={tracking.acknowledge}>
        Got it
      </Button>
    </Notice>
  );
}

const Card = styled.section`
  ${panel}
  align-items: center;
  display: flex;
  gap: ${SPACE_GROUP};
  padding: 10px 12px 10px 20px;

  @media ${BELOW_MOBILE} {
    align-items: stretch;
    flex-direction: column;
    gap: ${SPACE_SM};
    padding: 14px 16px;
  }
`;

const Notice = styled(Card).attrs({ as: 'div' })`
  border-color: ${COLOR_ACCENT_LINE};
`;

const Text = styled.p`
  flex: 1;
  font-size: ${TEXT_MD};
  margin: 0;
`;

const Muted = styled.span`
  color: ${COLOR_TEXT_MUTED};
`;

const Actions = styled.div`
  display: flex;
  gap: ${SPACE_SM};

  @media ${BELOW_MOBILE} {
    & > button:first-child {
      flex: 1;
    }
  }
`;
