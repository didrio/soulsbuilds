import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import SectionHeading from '@/components/ui/SectionHeading';
import { useAppSelector } from '@/app/hooks';
import { COLOR_TEXT_MUTED, TEXT_SM } from '@/theme';
import { filledAndNext, GroupHeading, ItemGroup, ItemRows, type SlotEntry } from '../ItemRow';
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
}

/**
 * Equipment panel: weapons (right hand, left hand), arrows and bolts, armor, talismans, great rune,
 * spirit ash and the flask's crystal tears, and consumables, as rows of tiles with names; a weapon whose
 * requirements the stats don't meet says so. Editable:
 * every slot (consumables: the filled ones and the next empty one), each a button that opens the
 * picker. Read-only: only the filled slots, and only the groups that have one.
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
    { title: 'Right hand', entries: [0, 1, 2].map(weaponEntry) },
    { title: 'Left hand', entries: [3, 4, 5].map(weaponEntry) },
    {
      title: 'Arrows and bolts',
      entries: ARROW_SLOTS.map((id) => ({ id, type: SLOT_TYPE_ARROW, item: equipment[id] })),
    },
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

  return (
    <Frame aria-labelledby="equipment-title">
      <SectionHeading id="equipment-title">Equipment</SectionHeading>
      {shown.length === 0 ? <Muted>No equipment yet.</Muted> : null}
      {shown.map((group) => (
        <ItemGroup key={group.title}>
          <GroupHeading>{group.title}</GroupHeading>
          <ItemRows entries={group.entries} editable={editable} />
        </ItemGroup>
      ))}
    </Frame>
  );
}

const Muted = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
  text-align: center;
`;

export default EquipmentEditor;
