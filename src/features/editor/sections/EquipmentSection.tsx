import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import SectionHeading from '@/components/ui/SectionHeading';
import { useAppSelector } from '@/app/hooks';
import { COLOR_LINE, SPACE_GROUP, SPACE_LG, SPACE_REGION } from '@/theme';
import { equipmentGroups, type GearGroup, type GearGroupKey } from '../gear';
import { selectGearState } from '../store/derived';
import { GearRow } from './GearTiles';

/** Where each group sits: the hands side by side at the top, the long lists across the panel. */
const ORDER: GearGroupKey[] = [
  'rightHand',
  'leftHand',
  'armor',
  'talismans',
  'flask',
  'arrows',
  'spells',
  'items',
];
const WIDE: ReadonlySet<GearGroupKey> = new Set(['spells', 'items']);

/** The tiles are bigger than the sidebar's (44 px): the weapons biggest, they make the build. */
const tileSize = (key: GearGroupKey) => (key === 'rightHand' || key === 'leftHand' ? 104 : 80);

/**
 * The Equipment tab (T63, the owner's design): the build's equipment as the main content, laid out
 * like the game's equipment screen: the right and left hand side by side, armor and talismans, the
 * flask's tears with the great rune and spirit ash (and arrows and bolts beside them when the build
 * has any), then spells and items across the panel. Icons only, no names (compact; the item card on
 * hover, focus or tap names each, `GearTile`); the fixed slots show empty ones faintly. On desktop the
 * panel is as tall as the stats beside it, the rows spread to fill it. Editing: every slot is a tile
 * that opens the picker.
 */
function EquipmentSection({ editable }: { editable: boolean }) {
  const groups = equipmentGroups(useAppSelector(selectGearState), editable);
  const byKey = new Map(groups.map((group) => [group.key, group]));
  const ordered = ORDER.flatMap((key) => {
    const group = byKey.get(key);
    return group ? [group] : [];
  });
  // Alone on its row, the flask spans it (no arrows beside it).
  const span = (group: GearGroup) =>
    WIDE.has(group.key) || (group.key === 'flask' && !byKey.has('arrows'));

  return (
    <Panel aria-labelledby="equipment-title">
      <SectionHeading id="equipment-title">Equipment</SectionHeading>
      <Layout>
        <Groups>
          {ordered.map((group) => (
            <Cell key={group.key} $wide={span(group)}>
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

// Rows divided by hairlines; the height left over is shared evenly between them (auto rows stretch).
const Groups = styled.div`
  align-content: stretch;
  display: grid;
  flex: 1;
  gap: ${SPACE_LG} ${SPACE_REGION};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @container (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

// Each row's group centered in its share of the height.
const Cell = styled.div<{ $wide: boolean }>`
  border-top: 1px solid ${COLOR_LINE};
  display: flex;
  flex-direction: column;
  justify-content: center;
  grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
  min-width: 0;
  padding-top: ${SPACE_GROUP};
`;

export default EquipmentSection;
