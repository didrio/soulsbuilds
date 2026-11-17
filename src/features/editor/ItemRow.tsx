import styled, { css } from 'styled-components';
import ItemTile from '@/components/ui/ItemTile';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { selectionBar } from '@/components/ui/inWorld';
import { useAppDispatch } from '@/app/hooks';
import { iconUrl } from '@/data/core';
import {
  COLOR_DANGER,
  COLOR_GLOW,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { slotWeaponDetails, type SlotEntry } from './gear';
import { weaponDetailLabels, type ItemWarning, type WeaponDetails } from './itemDetails';
import { factsLines, itemFacts } from './itemFacts';
import type { SlotType } from './slots';
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

export type { SlotEntry } from './gear';

/** Tile sizes in item rows: weapons, and every other slot. */
export type TileSize = 64 | 44;

/**
 * One slot as a row (the phone sections, T49): the item's tile, its name, up to two muted lines of
 * the item card's facts (T45: a weapon's affinity and skill, then its scaling and weight; an effect;
 * armor's weight and poise; a spell's FP and slots…) and a warning line when it can't be used as built. Editable rows are buttons
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
  const { type, item, warning = null } = entry;

  if (!item && !editable) {
    return (
      <Row $size={size}>
        <ItemTile src={null} size={size} placeholder />
        <VisuallyHidden>{`No ${SLOT_LABELS[type]}`}</VisuallyHidden>
      </Row>
    );
  }

  const weapon = slotWeaponDetails(entry);
  const facts = itemFacts(entry);
  const lines = facts ? factsLines(facts) : [];

  const content = (
    <>
      <ItemTile src={item ? iconUrl(item.icon) : null} size={size} />
      <Text>
        {item ? <Name>{item.name}</Name> : <Empty>{`Choose ${SLOT_LABELS[type]}`}</Empty>}
        {lines.map((line) => (
          <Sub key={line}>{line}</Sub>
        ))}
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
 * A filled slot's name with what's worth knowing: "Uchigatana (Blood affinity, Seppuku skill, Needs
 * 11 Str)". `''` for an empty slot.
 */
export function itemLabel(entry: SlotEntry, weapon: WeaponDetails | null = null) {
  const { item, warning } = entry;
  if (!item) return '';
  const details = [
    ...(weapon ? weaponDetailLabels(weapon) : []),
    ...(warning ? [warning.text] : []),
  ];
  return `${item.name}${details.length ? ` (${details.join(', ')})` : ''}`;
}

/**
 * An editable slot's accessible name: "Choose talisman" when empty, "Change Uchigatana (Blood
 * affinity, Seppuku skill)" when filled, with any warning.
 */
export function changeLabel(entry: SlotEntry, weapon: WeaponDetails | null = null) {
  if (!entry.item) return `Choose ${SLOT_LABELS[entry.type]}`;
  return `Change ${itemLabel(entry, weapon)}`;
}

/** The action that opens the item picker for a slot. */
export const openPickerFor = ({ id, type, affinityId, subId }: SlotEntry) =>
  openPicker({
    slotType: type,
    editSlot: id,
    editAffinitySlot: affinityId ?? null,
    editSubSlot: subId ?? null,
  });

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

// Not collected yet (tracking): muted, like the greyed-out tile.
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
