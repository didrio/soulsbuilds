import styled from 'styled-components';
import Button from '@/components/ui/Button';
import {
  BELOW_MOBILE,
  COLOR_ACCENT_LINE,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_SM,
  TEXT_MD,
} from '@/theme';
import { panel } from '@/components/ui/inWorld';
import type { BuildTracking } from './useBuildTracking';

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

const Notice = styled.div`
  ${panel}
  align-items: center;
  border-color: ${COLOR_ACCENT_LINE};
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

const Text = styled.p`
  flex: 1;
  font-size: ${TEXT_MD};
  margin: 0;
`;

const Muted = styled.span`
  color: ${COLOR_TEXT_MUTED};
`;
