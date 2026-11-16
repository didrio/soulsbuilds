import styled, { css } from 'styled-components';
import ItemTile from '@/components/ui/ItemTile';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
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
  COLOR_DANGER,
  COLOR_GLOW,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
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
import { labelText } from '@/components/ui/typography';

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

/** Tile sizes in the Loadout panel (T27): weapons, and every other slot. */
export type TileSize = 64 | 44;

/**
 * One slot as a row: the item's tile, its name, a muted detail line (a weapon's affinity and skill, a
 * spell's memory slots) and a warning line when it can't be used as built. Editable rows are buttons
 * that open the item picker for the slot, named "Choose talisman" when empty and "Change Uchigatana
 * (Blood affinity, Seppuku skill)" when filled; read-only rows are plain text, and an empty read-only
 * slot is a faint placeholder tile that keeps the layout the same on every build (T27).
 */
function ItemRow({
  entry,
  editable,
  size = 44,
}: {
  entry: SlotEntry;
  editable: boolean;
  size?: TileSize;
}) {
  const dispatch = useAppDispatch();
  const { type, item, affinity = null, ash = null, warning = null } = entry;

  if (!item && !editable) {
    return (
      <Row $size={size}>
        <ItemTile src={null} size={size} placeholder />
        <VisuallyHidden>{`No ${SLOT_LABELS[type]}`}</VisuallyHidden>
      </Row>
    );
  }

  // A weapon slot holds a weapon (the editor state's items are full data objects).
  const weapon = item && isWeaponType(type) ? weaponDetails(item as Weapon, ash, affinity) : null;
  const subline = item ? itemSubline(item, weapon) : '';

  const content = (
    <>
      <ItemTile src={item ? iconUrl(item.icon) : null} size={size} />
      <Text>
        {item ? <Name>{item.name}</Name> : <Empty>{`Choose ${SLOT_LABELS[type]}`}</Empty>}
        {subline ? <Sub>{subline}</Sub> : null}
        {item && warning ? <Warning $severity={warning.severity}>{warning.text}</Warning> : null}
      </Text>
    </>
  );

  if (!editable) return <Row $size={size}>{content}</Row>;

  return (
    <RowButton
      type="button"
      $size={size}
      aria-label={changeLabel(entry, weapon)}
      onClick={() => dispatch(openPickerFor(entry))}>
      {content}
    </RowButton>
  );
}

/**
 * An editable slot's accessible name: "Choose talisman" when empty, "Change Uchigatana (Blood
 * affinity, Seppuku skill)" when filled, with any warning.
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

/** A heading over a group of rows ("Talismans"): small muted capitals. */
export const GroupHeading = styled.h3`
  ${labelText}
  margin: 0 0 ${SPACE_XS};
`;

const rowStyles = css<{ $size: TileSize }>`
  align-items: center;
  display: flex;
  gap: ${({ $size }) => ($size === 64 ? '14px' : '12px')};
  min-height: ${({ $size }) => $size + 6}px;
  padding: 3px 0;
  position: relative;
  width: 100%;
`;

const Row = styled.div<{ $size: TileSize }>`
  ${rowStyles}
`;

const RowButton = styled.button<{ $size: TileSize }>`
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
  font-size: ${TEXT_MD};
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: break-word;
`;

const Empty = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
`;

const Sub = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  line-height: 1.3;
`;

const Warning = styled.span<{ $severity: ItemWarning['severity'] }>`
  color: ${({ $severity }) => ($severity === 'warning' ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  font-size: ${TEXT_XS};
  font-style: ${({ $severity }) => ($severity === 'note' ? 'italic' : 'normal')};
  font-weight: ${({ $severity }) => ($severity === 'warning' ? 600 : 400)};
  line-height: 1.4;
`;

export default ItemRow;
