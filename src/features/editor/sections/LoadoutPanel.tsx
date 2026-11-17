import styled from 'styled-components';
import { panel } from '@/components/ui/inWorld';
import { BELOW_TABLET, COLOR_LINE, SPACE_LG } from '@/theme';
import Loadout from './Loadout';
import StatsCard, { STATS_COLUMN_WIDTH } from './StatsCard';

/**
 * The Loadout tab's main panel (T28, owner's idea): on desktop the Stats card and the Loadout as one
 * panel, the stats in a fixed column on the left (as in the game's status screen) and the gear beside
 * them. Tablets and phones: the two cards stacked, stats first (T27). The same whether or not the
 * visitor tracks the build (T46).
 */
function LoadoutPanel({ editable, level }: { editable: boolean; level: number }) {
  return (
    <Panel>
      <StatsCard editable={editable} level={level} />
      <Loadout editable={editable} />
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
