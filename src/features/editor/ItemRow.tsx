import styled, { css } from 'styled-components';
import ItemTile from '@/components/ui/ItemTile';
import { selectionBar } from '@/components/ui/inWorld';
import { useAppDispatch } from '@/app/hooks';
import {
  iconUrl,
  type AffinityKey,
  type AshOfWar,
  type SlotDisplayItem,
  type Weapon,
} from '@/data/core';
import {
  BELOW_MOBILE,
  COLOR_DANGER,
  COLOR_GLOW,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_UI,
  SPACE_SM,
  SPACE_XS,
  TEXT_SM,
  TEXT_XS,
  TRACKING_CAPS,
} from '@/theme';
import {
  itemSubline,
  weaponDetailLabels,
  weaponDetails,
  type ItemWarning,
  type WeaponDetails,
} from './itemDetails';
import type { ItemSlot, SlotType, WeaponAffinitySlot, WeaponSkillSlot } from './slots';
import { openPicker } from './store/app';

/** What each slot type holds, for the empty rows and screen-reader labels ("Choose talisman"). */
export const SLOT_LABELS: Record<SlotType, string> = {
  SLOT_TYPE_ARROW: 'arrow or bolt',
  SLOT_TYPE_CHEST: 'chest armor',
  SLOT_TYPE_CON: 'item',
  SLOT_TYPE_GAUNTLET: 'gauntlets',
  SLOT_TYPE_GREAT_RUNE: 'great rune',
  SLOT_TYPE_HELM: 'helm',
  SLOT_TYPE_LEG: 'leg armor',
  SLOT_TYPE_SPELL: 'spell',
  SLOT_TYPE_SPIRIT_ASH: 'spirit ash',
  SLOT_TYPE_TAL: 'talisman',
  SLOT_TYPE_TEAR: 'crystal tear',
  SLOT_TYPE_WEAPON: 'weapon',
};

/** One slot of a build, as the panels list it. */
export interface SlotEntry {
  /** Editor slot the picker writes to. */
  id: ItemSlot;
  type: SlotType;
  item: SlotDisplayItem | null;
  /** Weapon slots: the slots that hold its affinity and Ash of War, and their values. */
  affinityId?: WeaponAffinitySlot;
  subId?: WeaponSkillSlot;
  affinity?: AffinityKey | null;
  ash?: AshOfWar | null;
  /** Unmet requirements or no room in the memory slots (T8). */
  warning?: ItemWarning | null;
}

const isWeaponType = (type: SlotType) => type === 'SLOT_TYPE_WEAPON';

/**
 * The filled slots plus the first empty one, for groups a build saves compacted (spells,
 * consumables): their slot positions aren't kept, so ten "Choose" rows would add nothing.
 */
export const filledAndNext = (entries: SlotEntry[]) => {
  const filled = entries.filter((entry) => entry.item);
  const next = entries.find((entry) => !entry.item);
  return next ? [...filled, next] : filled;
};

/**
 * One slot as a row: the item's tile, its name, a muted detail line (a weapon's affinity and skill, a
 * spell's memory slots) and a warning line when it can't be used as built. Editable rows are buttons that open the item picker for the slot,
 * named "Choose talisman" when empty and "Change Uchigatana (Blood affinity, Seppuku skill)" when
 * filled; read-only rows are plain text.
 */
function ItemRow({ entry, editable }: { entry: SlotEntry; editable: boolean }) {
  const dispatch = useAppDispatch();
  const { type, item, affinity = null, ash = null, warning = null } = entry;

  // A weapon slot holds a weapon (the editor state's items are full data objects).
  const weapon = item && isWeaponType(type) ? weaponDetails(item as Weapon, ash, affinity) : null;
  const subline = item ? itemSubline(item, weapon) : '';

  const content = (
    <>
      <ItemTile src={item ? iconUrl(item.icon) : null} size={TILE_SIZE} />
      <Text>
        {item ? (
          <Name>{item.name}</Name>
        ) : (
          <Empty>{editable ? `Choose ${SLOT_LABELS[type]}` : 'Empty'}</Empty>
        )}
        {subline ? <Sub>{subline}</Sub> : null}
        {item && warning ? <Warning $severity={warning.severity}>{warning.text}</Warning> : null}
      </Text>
    </>
  );

  if (!editable) return <Row>{content}</Row>;

  return (
    <RowButton
      type="button"
      aria-label={changeLabel(entry, weapon)}
      onClick={() => dispatch(openPickerFor(entry))}>
      {content}
    </RowButton>
  );
}

/**
 * An editable slot's accessible name: "Choose talisman" when empty, "Change Uchigatana (Blood
 * affinity, Seppuku skill)" when filled, with any warning. Shared by rows and icon tiles.
 */
export function changeLabel(entry: SlotEntry, weapon: WeaponDetails | null = null) {
  const { item, type, warning } = entry;
  if (!item) return `Choose ${SLOT_LABELS[type]}`;
  const details = [
    ...(weapon ? weaponDetailLabels(weapon) : []),
    ...(warning ? [warning.text] : []),
  ];
  return `Change ${item.name}${details.length ? ` (${details.join(', ')})` : ''}`;
}

/** The action that opens the item picker for a slot. */
export const openPickerFor = ({ id, type, affinityId, subId }: SlotEntry) =>
  openPicker({
    slotType: type,
    editSlot: id,
    editAffinitySlot: affinityId ?? null,
    editSubSlot: subId ?? null,
  });

/** A list of slot rows (view mode passes only the filled ones). */
export function ItemRows({
  entries,
  editable,
  columns = 2,
}: {
  entries: SlotEntry[];
  editable: boolean;
  columns?: 1 | 2;
}) {
  return (
    <ItemList $columns={columns}>
      {entries.map((entry) => (
        <li key={entry.id}>
          <ItemRow entry={entry} editable={editable} />
        </li>
      ))}
    </ItemList>
  );
}

/** A heading over a group of rows ("Talismans"): small muted capitals. */
export const GroupHeading = styled.h3`
  color: ${COLOR_TEXT_MUTED};
  font-family: ${FONT_UI};
  font-size: ${TEXT_XS};
  font-weight: 600;
  letter-spacing: ${TRACKING_CAPS};
  margin: 0 0 ${SPACE_XS};
  text-transform: uppercase;
`;

/** The rows of a group: two columns, one on phones (`$columns={1}` for narrow panels and hands). */
const ItemList = styled.ul<{ $columns?: 1 | 2 }>`
  display: grid;
  gap: 2px ${SPACE_SM};
  grid-template-columns: ${({ $columns = 2 }) => `repeat(${$columns}, minmax(0, 1fr))`};
  list-style: none;
  margin: 0;
  padding: 0;

  @media ${BELOW_MOBILE} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const TILE_SIZE = 52;

const rowStyles = css`
  align-items: center;
  display: flex;
  gap: 12px;
  min-height: 62px;
  padding: 5px 6px;
  position: relative;
  width: 100%;
`;

const Row = styled.div`
  ${rowStyles}
`;

const RowButton = styled.button`
  ${rowStyles}
  ${selectionBar}
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:hover > span:first-child,
  &:focus-visible > span:first-child {
    box-shadow: 0 0 12px ${COLOR_GLOW};
  }
`;

const Text = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Name = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_SM};
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
`;

const Empty = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
`;

const Sub = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  line-height: 1.4;
`;

const Warning = styled.span<{ $severity: ItemWarning['severity'] }>`
  color: ${({ $severity }) => ($severity === 'warning' ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  font-size: ${TEXT_XS};
  font-style: ${({ $severity }) => ($severity === 'note' ? 'italic' : 'normal')};
  font-weight: ${({ $severity }) => ($severity === 'warning' ? 600 : 400)};
  line-height: 1.4;
`;

export default ItemRow;
