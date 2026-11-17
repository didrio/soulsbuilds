import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import { useAppSelector } from '@/app/hooks';
import { COLOR_LINE, SPACE_GROUP, SPACE_REGION } from '@/theme';
import { equipmentGroups, equipmentLayout, type GearGroupKey } from '../gear';
import { selectGearState } from '../store/derived';
import { GearRow } from './GearTiles';

/** The tiles are bigger than the sidebar's (44 px): the weapons biggest, they make the build. */
const tileSize = (key: GearGroupKey) => (key === 'rightHand' || key === 'leftHand' ? 104 : 68);

/**
 * The Equipment tab (T63, the owner's design; T66: denser, so a full build fits above the fold): the
 * build's equipment as the main content, laid out like the game's equipment screen: the right and
 * left hand side by side, armor and talismans, then the flask's tears with the great rune and spirit
 * ash, arrows and bolts, spells and items, two to a row when they're short (`equipmentLayout`). No
 * heading: the current tab names it. Icons only, no names (compact; the item card on hover, focus or
 * tap names each, `GearTile`); the fixed slots show empty ones faintly. On desktop the panel is as
 * tall as the stats beside it, the rows spread to fill it. Editing: every slot is a tile that opens
 * the picker.
 */
function EquipmentSection({ editable }: { editable: boolean }) {
  const cells = equipmentLayout(equipmentGroups(useAppSelector(selectGearState), editable));

  return (
    <Panel as="section" aria-label="Equipment">
      <Layout>
        <Groups>
          {cells.map(({ group, wide }, index) => (
            <Cell
              key={group.key}
              $wide={wide}
              $top={index === 0 || (index === 1 && cells[0]?.wide === false)}>
              <GearRow group={group} editable={editable} size={tileSize(group.key)} />
            </Cell>
          ))}
        </Groups>
      </Layout>
    </Panel>
  );
}

// A column, so the groups can take the room left when the stats beside it are taller.
const Panel = styled(Frame)`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

// The container the two columns are measured against (narrow desktop windows get one).
const Layout = styled.div`
  container-type: inline-size;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

// Rows divided by hairlines (none above the first); the height left over is shared evenly between
// them (auto rows stretch).
const Groups = styled.div`
  align-content: stretch;
  display: grid;
  flex: 1;
  gap: 16px ${SPACE_REGION};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @container (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

// Each row's group centered in its share of the height; a hairline above every row but the first.
const Cell = styled.div<{ $wide: boolean; $top: boolean }>`
  border-top: ${({ $top }) => ($top ? 'none' : `1px solid ${COLOR_LINE}`)};
  display: flex;
  flex-direction: column;
  justify-content: center;
  grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
  min-width: 0;
  padding-top: ${({ $top }) => ($top ? '0' : SPACE_GROUP)};
`;

export default EquipmentSection;
