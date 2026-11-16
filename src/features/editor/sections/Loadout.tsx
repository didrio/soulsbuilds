import { useId } from 'react';
import styled, { css } from 'styled-components';
import Frame from '@/components/ui/Frame';
import SectionHeading from '@/components/ui/SectionHeading';
import { useAppSelector } from '@/app/hooks';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  BELOW_WIDE,
  COLOR_DANGER,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_LG,
  SPACE_MD,
  SPACE_REGION,
  SPACE_SM,
  TEXT_SM,
} from '@/theme';
import ItemRow, { filledAndNext, GroupHeading, type SlotEntry, type TileSize } from '../ItemRow';
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
  SLOT_TYPE_SPELL,
  SLOT_TYPE_SPIRIT_ASH,
  SLOT_TYPE_TAL,
  SLOT_TYPE_TEAR,
  SLOT_TYPE_WEAPON,
  SPELL_SLOTS,
  TALISMAN_SLOTS,
  TEAR_SLOTS,
  WEAPON_AFFINITY_SLOTS,
  WEAPON_SKILL_SLOTS,
  WEAPON_SLOTS,
  type SlotType,
} from '../slots';
import {
  selectMemorySlots,
  selectMemoryUsed,
  selectRequirementChecks,
  selectSpellsOverSlots,
} from '../store/derived';
import { selectEquipment, selectSpellSlots, selectTearSlots } from '../store/selectors';

const ARMOR_TYPES: Record<(typeof ARMOR_SLOTS)[number], SlotType> = {
  helm: SLOT_TYPE_HELM,
  chest: SLOT_TYPE_CHEST,
  gauntlet: SLOT_TYPE_GAUNTLET,
  leg: SLOT_TYPE_LEG,
};

/** Columns of the spell grid: one cell per memory slot, so 10 slots make two rows on desktop. */
const SPELL_COLUMNS = 5;
/** Below 1100 px, where the gear column beside the stats is narrow (T28). */
const SPELL_COLUMNS_MEDIUM = 3;
const SPELL_COLUMNS_NARROW = 2;

/** The memory slots a spell cell spans: the spell's cost, 1 for an empty cell. */
const memoryCost = ({ item }: SlotEntry) =>
  item && 'slots' in item && typeof item.slots === 'number' ? item.slots : 1;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** A group of slots under a small heading ("Talismans"), as a list. */
function Group({
  title,
  entries,
  editable,
  size = 44,
  wide = false,
}: {
  title: string;
  entries: SlotEntry[];
  editable: boolean;
  size?: TileSize;
  /** Two columns wide, its rows in two columns (consumables). */
  wide?: boolean;
}) {
  const id = useId();
  return (
    <GroupBox $wide={wide}>
      <GroupHeading id={id}>{title}</GroupHeading>
      <Rows aria-labelledby={id} $wide={wide}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <ItemRow entry={entry} editable={editable} size={size} />
          </li>
        ))}
      </Rows>
    </GroupBox>
  );
}

/**
 * The Loadout panel (T27; on desktop beside the stats in one panel, T28): everything the build equips, every item by name, in a fixed layout so it
 * takes the same space on every build. Left hand | right hand (stacked on phones; 3 weapons each, 64px tiles, affinity
 * and skill, a warning when the stats don't meet the requirements); armor, talismans, and the flask's
 * tears with the great rune and spirit ash in three columns (44px tiles); arrows and bolts and
 * consumables only when the build has some (or while editing); then the spells, one cell per memory
 * slot (a 2-slot spell spans two), the free slots as placeholders.
 *
 * Read-only: empty slots are faint placeholders. Editable: every slot is a button that opens the
 * picker ("Choose helm" when empty); consumables and spells, saved without slot positions, show the
 * filled ones and one "Choose" slot.
 */
function Loadout({ editable }: { editable: boolean }) {
  const equipment = useAppSelector(selectEquipment);
  const tears = useAppSelector(selectTearSlots);
  const spells = useAppSelector(selectSpellSlots);
  const checks = useAppSelector(selectRequirementChecks);
  const over = useAppSelector(selectSpellsOverSlots);
  const available = useAppSelector(selectMemorySlots);
  const used = useAppSelector(selectMemoryUsed);

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
  // Weapon slots 1–3 are the right hand, 4–6 the left; the left hand is shown first (on the left).
  const leftHand = [3, 4, 5].map(weaponEntry);
  const rightHand = [0, 1, 2].map(weaponEntry);
  const armor = ARMOR_SLOTS.map((id): SlotEntry => ({
    id,
    type: ARMOR_TYPES[id],
    item: equipment[id],
  }));
  const talismans = TALISMAN_SLOTS.map((id): SlotEntry => ({
    id,
    type: SLOT_TYPE_TAL,
    item: equipment[id],
  }));
  const flask = TEAR_SLOTS.map((id): SlotEntry => ({ id, type: SLOT_TYPE_TEAR, item: tears[id] }));
  const runeAndAsh: SlotEntry[] = [
    { id: 'greatRune', type: SLOT_TYPE_GREAT_RUNE, item: equipment.greatRune },
    { id: 'spiritAsh', type: SLOT_TYPE_SPIRIT_ASH, item: equipment.spiritAsh },
  ];
  const arrows = ARROW_SLOTS.map((id): SlotEntry => ({
    id,
    type: SLOT_TYPE_ARROW,
    item: equipment[id],
  }));
  const consumables = CONSUMABLE_SLOTS.map((id): SlotEntry => ({
    id,
    type: SLOT_TYPE_CON,
    item: equipment[id],
  }));

  const filled = (entries: SlotEntry[]) => entries.filter((entry) => entry.item);
  // Arrows and consumables: only when the build has some (owner, T27), always while editing.
  const showArrows = editable || filled(arrows).length > 0;
  const shownConsumables = editable ? filledAndNext(consumables) : filled(consumables);
  const showConsumables = shownConsumables.length > 0;

  const itemCount = [
    ...leftHand,
    ...rightHand,
    ...armor,
    ...talismans,
    ...flask,
    ...runeAndAsh,
    ...arrows,
    ...consumables,
  ].filter((entry) => entry.item).length;

  // Spells: the filled ones in order, then (editing) one "Choose spell", then a placeholder for each
  // memory slot still free.
  const spellEntries: SlotEntry[] = SPELL_SLOTS.map((id) => ({
    id,
    type: SLOT_TYPE_SPELL,
    item: spells[id],
    warning: itemWarning(checks[id], over.has(id)),
  }));
  const filledSpells = filled(spellEntries);
  const free = Math.max(0, available - used);
  const nextSpell = editable && free > 0 ? spellEntries.find((entry) => !entry.item) : undefined;
  const spellCells = [...filledSpells, ...(nextSpell ? [nextSpell] : [])];
  const freeCells = Array.from({ length: free - (nextSpell ? 1 : 0) }, (_, index) => index);

  const summary =
    itemCount + filledSpells.length > 0
      ? `${plural(itemCount, 'item')} · ${plural(filledSpells.length, 'spell')}`
      : editable
        ? ''
        : 'No items yet';

  return (
    <Frame aria-labelledby="loadout-title">
      <Head>
        <SectionHeading id="loadout-title">Loadout</SectionHeading>
        {summary ? <Summary>{summary}</Summary> : null}
      </Head>
      <Hands>
        <Group title="Left hand" entries={leftHand} editable={editable} size={64} />
        <Group title="Right hand" entries={rightHand} editable={editable} size={64} />
      </Hands>
      <Columns>
        <Group title="Armor" entries={armor} editable={editable} />
        <Group title="Talismans" entries={talismans} editable={editable} />
        <Stack>
          <Group title="Flask of Wondrous Physick" entries={flask} editable={editable} />
          <Group title="Great rune and spirit ash" entries={runeAndAsh} editable={editable} />
        </Stack>
      </Columns>
      {showArrows || showConsumables ? (
        <Columns>
          {showArrows ? (
            <Group title="Arrows and bolts" entries={arrows} editable={editable} />
          ) : null}
          {showConsumables ? (
            <Group title="Consumables" entries={shownConsumables} editable={editable} wide />
          ) : null}
        </Columns>
      ) : null}
      <Spells aria-labelledby="spells-title">
        <SpellsHead>
          <GroupHeading id="spells-title">Spells</GroupHeading>
          <SlotCount $over={used > available}>
            <strong>{used}</strong>
            {` of ${available} memory slots`}
          </SlotCount>
        </SpellsHead>
        <SpellGrid aria-labelledby="spells-title">
          {spellCells.map((entry) => (
            <SpellCell key={entry.id} $span={memoryCost(entry)}>
              <ItemRow entry={entry} editable={editable} />
            </SpellCell>
          ))}
          {freeCells.map((index) => (
            <SpellCell key={`free-${index}`} $span={1}>
              {/* A free memory slot: a read-only placeholder (the id isn't used). */}
              <ItemRow
                entry={{ id: SPELL_SLOTS[0], type: SLOT_TYPE_SPELL, item: null }}
                editable={false}
              />
            </SpellCell>
          ))}
        </SpellGrid>
      </Spells>
    </Frame>
  );
}

const Head = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  justify-content: space-between;
  margin-bottom: ${SPACE_GROUP};

  & > h2 {
    margin: 0;
  }
`;

const Summary = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
`;

// Each block after the hands sits under a rule.
const ruled = css`
  border-top: 1px solid ${COLOR_LINE};
  margin-top: ${SPACE_MD};
  padding-top: ${SPACE_MD};
`;

// Left hand | right hand; stacked on phones, left hand first (side by side, names wrapped to 3–4 lines).
const Hands = styled.div`
  column-gap: 32px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media ${BELOW_MOBILE} {
    grid-template-columns: minmax(0, 1fr);
    row-gap: ${SPACE_MD};
  }
`;

// Three columns of groups; one on phones.
const Columns = styled.div`
  ${ruled}
  display: grid;
  gap: ${SPACE_MD} ${SPACE_REGION};
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media ${BELOW_MOBILE} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Stack = styled.div`
  display: grid;
  gap: ${SPACE_MD};
  align-content: start;
`;

const GroupBox = styled.div<{ $wide: boolean }>`
  grid-column: ${({ $wide }) => ($wide ? 'span 2' : 'auto')};
  min-width: 0;

  @media ${BELOW_MOBILE} {
    grid-column: auto;
  }
`;

const Rows = styled.ul<{ $wide: boolean }>`
  column-gap: ${SPACE_REGION};
  display: grid;
  grid-template-columns: ${({ $wide }) => ($wide ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)')};
  list-style: none;
  margin: 0;
  padding: 0;

  @media ${BELOW_MOBILE} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Spells = styled.section`
  ${ruled}
`;

const SpellsHead = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${SPACE_GROUP};
  margin-bottom: 2px;

  & > h3 {
    margin: 0;
  }
`;

const SlotCount = styled.p<{ $over: boolean }>`
  color: ${({ $over }) => ($over ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  font-size: ${TEXT_SM};
  font-variant-numeric: tabular-nums;
  margin: 0;

  strong {
    color: ${({ $over }) => ($over ? COLOR_DANGER : COLOR_TEXT)};
    font-weight: 600;
  }
`;

// One cell per memory slot. `dense` lets a free slot fill the gap a 2-slot spell leaves at a row's end.
const SpellGrid = styled.ul`
  display: grid;
  gap: 0 ${SPACE_LG};
  grid-auto-flow: row dense;
  grid-template-columns: repeat(${SPELL_COLUMNS}, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;

  @media ${BELOW_WIDE} {
    grid-template-columns: repeat(${SPELL_COLUMNS_MEDIUM}, minmax(0, 1fr));
  }

  @media ${BELOW_TABLET} {
    column-gap: ${SPACE_GROUP};
    grid-template-columns: repeat(${SPELL_COLUMNS_NARROW}, minmax(0, 1fr));
  }
`;

const SpellCell = styled.li<{ $span: number }>`
  grid-column: span ${({ $span }) => Math.min(Math.max($span, 1), SPELL_COLUMNS)};
  min-width: 0;

  @media ${BELOW_WIDE} {
    grid-column: span ${({ $span }) => Math.min(Math.max($span, 1), SPELL_COLUMNS_MEDIUM)};
  }

  @media ${BELOW_TABLET} {
    grid-column: span ${({ $span }) => Math.min(Math.max($span, 1), SPELL_COLUMNS_NARROW)};
  }
`;

export default Loadout;
