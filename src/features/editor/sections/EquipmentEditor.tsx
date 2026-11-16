import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import SectionHeading from '@/components/ui/SectionHeading';
import { useAppSelector } from '@/app/hooks';
import {
  BELOW_MOBILE,
  COLOR_LINE,
  COLOR_TEXT_MUTED,
  SPACE_LG,
  SPACE_MD,
  SPACE_XL,
  TEXT_SM,
} from '@/theme';
import { filledAndNext, GroupHeading, ItemRows, type SlotEntry } from '../ItemRow';
import ItemSlot from '../ItemSlot';
import { itemWarning } from '../itemDetails';
import {
  ARMOR_SLOTS,
  ARROW_SLOTS,
  CONSUMABLE_SLOTS,
  SLOT_TYPE_ARROW,
  SLOT_TYPE_CHEST,
  SLOT_TYPE_CON,
  SLOT_TYPE_GAUNTLET,
  SLOT_TYPE_GREAT_RUNE,
  SLOT_TYPE_HELM,
  SLOT_TYPE_LEG,
  SLOT_TYPE_SPIRIT_ASH,
  SLOT_TYPE_TAL,
  SLOT_TYPE_TEAR,
  SLOT_TYPE_WEAPON,
  TALISMAN_SLOTS,
  TEAR_SLOTS,
  WEAPON_AFFINITY_SLOTS,
  WEAPON_SKILL_SLOTS,
  WEAPON_SLOTS,
  type SlotType,
} from '../slots';
import { selectRequirementChecks } from '../store/derived';
import { selectEquipment, selectTearSlots } from '../store/selectors';

const ARMOR_TYPES: Record<(typeof ARMOR_SLOTS)[number], SlotType> = {
  helm: SLOT_TYPE_HELM,
  chest: SLOT_TYPE_CHEST,
  gauntlet: SLOT_TYPE_GAUNTLET,
  leg: SLOT_TYPE_LEG,
};

interface Group {
  title: string;
  entries: SlotEntry[];
  /** Saved without slot positions: edit mode shows the filled slots and one empty one. */
  compact?: boolean;
  /** Weapons: rows with names (a weapon's icon doesn't show its affinity or skill). */
  labeled?: boolean;
}

/**
 * Equipment panel (T22: full width, compact): the weapons (right hand, left hand) as rows with names,
 * affinity and skill, and a warning when the stats don't meet the requirements; then armor, talismans,
 * great rune, spirit ash and the flask's crystal tears, arrows and bolts, and consumables as icon
 * tiles (names on hover, focus or tap). Editable: every slot (consumables: the filled ones and the
 * next empty one), each a button that opens the picker. Read-only: only the filled slots, and only
 * the groups that have one.
 */
function EquipmentEditor({ editable }: { editable: boolean }) {
  const equipment = useAppSelector(selectEquipment);
  const tears = useAppSelector(selectTearSlots);
  const checks = useAppSelector(selectRequirementChecks);

  const weaponEntry = (index: number): SlotEntry => {
    const id = WEAPON_SLOTS[index]!;
    const affinityId = WEAPON_AFFINITY_SLOTS[index]!;
    const subId = WEAPON_SKILL_SLOTS[index]!;
    return {
      id,
      type: SLOT_TYPE_WEAPON,
      item: equipment[id],
      affinityId,
      subId,
      affinity: equipment[affinityId],
      ash: equipment[subId],
      warning: itemWarning(checks[id]),
    };
  };

  const groups: Group[] = [
    { title: 'Right hand', entries: [0, 1, 2].map(weaponEntry), labeled: true },
    { title: 'Left hand', entries: [3, 4, 5].map(weaponEntry), labeled: true },
    {
      title: 'Armor',
      entries: ARMOR_SLOTS.map((id) => ({ id, type: ARMOR_TYPES[id], item: equipment[id] })),
    },
    {
      title: 'Talismans',
      entries: TALISMAN_SLOTS.map((id) => ({ id, type: SLOT_TYPE_TAL, item: equipment[id] })),
    },
    {
      title: 'Great rune, spirit ash and flask',
      entries: [
        { id: 'greatRune', type: SLOT_TYPE_GREAT_RUNE, item: equipment.greatRune },
        { id: 'spiritAsh', type: SLOT_TYPE_SPIRIT_ASH, item: equipment.spiritAsh },
        ...TEAR_SLOTS.map((id): SlotEntry => ({ id, type: SLOT_TYPE_TEAR, item: tears[id] })),
      ],
    },
    {
      title: 'Arrows and bolts',
      entries: ARROW_SLOTS.map((id) => ({ id, type: SLOT_TYPE_ARROW, item: equipment[id] })),
    },
    {
      title: 'Consumables',
      entries: CONSUMABLE_SLOTS.map((id) => ({ id, type: SLOT_TYPE_CON, item: equipment[id] })),
      compact: true,
    },
  ];

  const shown = editable
    ? groups.map((group) =>
        group.compact ? { ...group, entries: filledAndNext(group.entries) } : group,
      )
    : groups
        .map((group) => ({ ...group, entries: group.entries.filter((entry) => entry.item) }))
        .filter((group) => group.entries.length > 0);

  const hands = shown.filter((group) => group.labeled);
  const tiles = shown.filter((group) => !group.labeled);

  return (
    <Frame aria-labelledby="equipment-title">
      <SectionHeading id="equipment-title">Equipment</SectionHeading>
      {shown.length === 0 ? <Muted>No equipment yet.</Muted> : null}
      {hands.length ? (
        <Hands>
          {hands.map((group) => (
            <div key={group.title}>
              <GroupHeading>{group.title}</GroupHeading>
              <ItemRows entries={group.entries} editable={editable} columns={1} />
            </div>
          ))}
        </Hands>
      ) : null}
      {tiles.length ? (
        <TileGroups $ruled={hands.length > 0}>
          {tiles.map((group) => (
            <div key={group.title}>
              <GroupHeading>{group.title}</GroupHeading>
              <Tiles>
                {group.entries.map((entry) => (
                  <li key={entry.id}>
                    <ItemSlot entry={entry} editable={editable} />
                  </li>
                ))}
              </Tiles>
            </div>
          ))}
        </TileGroups>
      ) : null}
    </Frame>
  );
}

// Right hand | left hand; one column on phones.
const Hands = styled.div`
  column-gap: ${SPACE_XL};
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media ${BELOW_MOBILE} {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 18px;
  }
`;

// The icon groups side by side, wrapping; under a rule when the weapons are above.
const TileGroups = styled.div<{ $ruled: boolean }>`
  border-top: ${({ $ruled }) => ($ruled ? `1px solid ${COLOR_LINE}` : 'none')};
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_MD} ${SPACE_XL};
  margin-top: ${({ $ruled }) => ($ruled ? SPACE_MD : 0)};
  padding-top: ${({ $ruled }) => ($ruled ? SPACE_MD : 0)};

  @media ${BELOW_MOBILE} {
    column-gap: ${SPACE_LG};
  }
`;

const Tiles = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Muted = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
  text-align: center;
`;

export default EquipmentEditor;
