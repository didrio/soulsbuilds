import styled from 'styled-components';
import { panel } from '@/components/ui/inWorld';
import { BELOW_TABLET, COLOR_LINE, SPACE_LG } from '@/theme';
import type { StatsTracking } from '@/features/tracking/TrackedAttributes';
import Loadout, { type LoadoutTracking } from './Loadout';
import StatsCard, { STATS_COLUMN_WIDTH } from './StatsCard';

/**
 * The Loadout tab's main panel (T28, owner's idea): on desktop the Stats card and the Loadout as one
 * panel, the stats in a fixed column on the left (as in the game's status screen) and the gear beside
 * them. Tablets and phones: the two cards stacked, stats first (T27). While the player tracks the
 * build (T34), both are in tracking mode.
 */
function LoadoutPanel({
  editable,
  level,
  tracking,
}: {
  editable: boolean;
  level: number;
  tracking?: { stats: StatsTracking; loadout: LoadoutTracking };
}) {
  return (
    <Panel>
      <StatsCard editable={editable} level={level} tracking={tracking?.stats} />
      <Loadout editable={editable} tracking={tracking?.loadout} />
    </Panel>
  );
}

// The cards keep their padding; on desktop their own surface and border give way to the shared one.
const Panel = styled.div`
  ${panel}
  display: grid;
  grid-template-columns: ${STATS_COLUMN_WIDTH}px minmax(0, 1fr);

  & > section {
    background: none;
    border: none;
    border-radius: 0;
    min-width: 0;
  }

  & > section + section {
    border-left: 1px solid ${COLOR_LINE};
  }

  @media ${BELOW_TABLET} {
    background: none;
    border: none;
    gap: ${SPACE_LG};
    grid-template-columns: minmax(0, 1fr);

    & > section {
      ${panel}
    }
  }
`;

export default LoadoutPanel;
