import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import DropDown from '@/components/ui/DropDown';
import ItemTile from '@/components/ui/ItemTile';
import SegmentedControl from '@/components/ui/SegmentedControl';
import TextInput from '@/components/ui/TextInput';
import { TextButton } from '@/components/ui/TextButton';
import { selectionBar } from '@/components/ui/inWorld';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  armorList,
  arrows,
  ashChoices,
  consumables,
  greatRunes,
  iconUrl,
  spells,
  spiritAshes,
  talismanConflict,
  talismans,
  tears,
  weapons,
  weaponTypes,
  type Armor,
  type Arrow,
  type Goods,
  type SlotItem,
  type Spell,
  type Talisman,
  type Weapon,
} from '@/data';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_FRAME,
  COLOR_GLOW,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_MD,
  SPACE_SM,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import {
  filterItems,
  NO_FILTERS,
  presentTypes,
  type DlcFilter,
  type PickerFilters,
  type SpellKindFilter,
} from './picker';
import {
  ARROW_SLOTS,
  CONSUMABLE_SLOTS,
  SPELL_SLOTS,
  TALISMAN_SLOTS,
  TEAR_SLOTS,
  WEAPON_SLOTS,
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
  isSlot,
  type SlotType,
} from './slots';
import { closePicker } from './store/app';
import {
  updateHelm,
  updateLeg,
  updateChest,
  updateGauntlet,
  updateGreatRune,
  updateSpiritAsh,
  updateArrow,
  updateCon,
  updateTal,
  updateWeapon,
} from './store/equipment';
import { updateSpell } from './store/spells';
import { updateTear } from './store/tears';
import {
  selectEditSlot,
  selectEditedItem,
  selectEquipment,
  selectSlotType,
} from './store/selectors';
import WeaponOptions from './WeaponOptions';

const itemsForSlotType = (slotType: SlotType | null): readonly SlotItem[] => {
  switch (slotType) {
    case SLOT_TYPE_ARROW:
      return arrows;
    case SLOT_TYPE_CHEST:
      return armorList('chest');
    case SLOT_TYPE_CON:
      return consumables;
    case SLOT_TYPE_GAUNTLET:
      return armorList('arms');
    case SLOT_TYPE_GREAT_RUNE:
      return greatRunes;
    case SLOT_TYPE_HELM:
      return armorList('head');
    case SLOT_TYPE_LEG:
      return armorList('legs');
    case SLOT_TYPE_SPELL:
      return spells;
    case SLOT_TYPE_SPIRIT_ASH:
      return spiritAshes;
    case SLOT_TYPE_TAL:
      return talismans;
    case SLOT_TYPE_TEAR:
      return tears;
    case SLOT_TYPE_WEAPON:
      return weapons;
    default:
      return [];
  }
};

/** The picker's title per slot type. */
const TITLES: Record<SlotType, string> = {
  SLOT_TYPE_ARROW: 'Arrows and bolts',
  SLOT_TYPE_CHEST: 'Chest armor',
  SLOT_TYPE_CON: 'Items',
  SLOT_TYPE_GAUNTLET: 'Gauntlets',
  SLOT_TYPE_GREAT_RUNE: 'Great runes',
  SLOT_TYPE_HELM: 'Helms',
  SLOT_TYPE_LEG: 'Leg armor',
  SLOT_TYPE_SPELL: 'Spells',
  SLOT_TYPE_SPIRIT_ASH: 'Spirit ashes',
  SLOT_TYPE_TAL: 'Talismans',
  SLOT_TYPE_TEAR: 'Crystal tears',
  SLOT_TYPE_WEAPON: 'Weapons',
};

const SPELL_KINDS: { value: SpellKindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sorcery', label: 'Sorceries' },
  { value: 'incantation', label: 'Incantations' },
];

const DLC_OPTIONS: { value: DlcFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'base', label: 'Base game' },
  { value: 'dlc', label: 'DLC' },
];

/** The weapon types in the weapon list, for the type filter. */
const WEAPON_TYPE_OPTIONS = presentTypes(weaponTypes, weapons).map((type) => ({
  value: String(type.id),
  label: type.name,
}));

/** Memory slots a spell takes, shown next to it. */
const slotsText = (spell: Spell) => `${spell.slots} ${spell.slots === 1 ? 'slot' : 'slots'}`;

/** A weapon that has something to choose: an Ash of War (and with it an affinity). */
const hasWeaponOptions = (weapon: Weapon) => ashChoices(weapon).length > 0;

type Step = 'list' | 'weapon';

/**
 * The item picker dialog for the slot being edited. List step: search, filters (weapon type, spell
 * kind, base game/DLC), the matching items a page at a time with the current one marked, and Remove.
 * Picking an item writes it to the slot and closes the picker, except a weapon with an Ash of War to
 * choose: that moves to the weapon step (Ash of War and affinity, Done, Change weapon), which is also
 * where a filled weapon slot opens. Talismans that can't be worn with one already worn say so.
 */
function ItemSelector() {
  const dispatch = useAppDispatch();
  const editSlot = useAppSelector(selectEditSlot);
  const equipment = useAppSelector(selectEquipment);
  const slotType = useAppSelector(selectSlotType);
  const currentItem = useAppSelector(selectEditedItem);

  const [step, setStep] = useState<Step>(
    slotType === SLOT_TYPE_WEAPON && currentItem ? 'weapon' : 'list',
  );
  const [filters, setFilters] = useState<PickerFilters>(NO_FILTERS);
  // The weapon list alone has ~490 rows: render a page at a time (a search or filter narrows it first).
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Switching steps replaces what had focus: move it to the step's first control (on opening, this is
  // where Dialog puts it anyway).
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bodyRef.current?.querySelector<HTMLElement>('input, select, button')?.focus();
  }, [step]);

  const goTo = (next: Step) => setStep(next);

  const handleClose = () => {
    dispatch(closePicker());
  };

  const setFilter = (change: Partial<PickerFilters>) => {
    setFilters((current) => ({ ...current, ...change }));
    setVisibleCount(PAGE_SIZE);
  };

  const options = filterItems(itemsForSlotType(slotType), filters);

  // Talismans worn in the other slots: one of the same group can't be added.
  const otherTalismans =
    slotType === SLOT_TYPE_TAL
      ? TALISMAN_SLOTS.filter((slot) => slot !== editSlot).map((slot) => equipment[slot])
      : [];

  // The item list matches the slot type, so the casts below narrow to what the list holds.
  /** Puts `item` in the slot being edited (null empties it), then closes or moves to the weapon step. */
  const handleSelectItem = (item: SlotItem | null) => () => {
    switch (slotType) {
      case SLOT_TYPE_ARROW:
        if (isSlot(ARROW_SLOTS, editSlot))
          dispatch(updateArrow({ id: editSlot, item: item as Arrow }));
        break;
      case SLOT_TYPE_CHEST:
        dispatch(updateChest(item as Armor));
        break;
      case SLOT_TYPE_CON:
        if (isSlot(CONSUMABLE_SLOTS, editSlot))
          dispatch(updateCon({ id: editSlot, item: item as Goods }));
        break;
      case SLOT_TYPE_GAUNTLET:
        dispatch(updateGauntlet(item as Armor));
        break;
      case SLOT_TYPE_GREAT_RUNE:
        dispatch(updateGreatRune(item as Goods));
        break;
      case SLOT_TYPE_HELM:
        dispatch(updateHelm(item as Armor));
        break;
      case SLOT_TYPE_LEG:
        dispatch(updateLeg(item as Armor));
        break;
      case SLOT_TYPE_SPELL:
        if (isSlot(SPELL_SLOTS, editSlot))
          dispatch(updateSpell({ id: editSlot, item: item as Spell }));
        break;
      case SLOT_TYPE_SPIRIT_ASH:
        dispatch(updateSpiritAsh(item as Goods));
        break;
      case SLOT_TYPE_TAL:
        if (isSlot(TALISMAN_SLOTS, editSlot))
          dispatch(updateTal({ id: editSlot, item: item as Talisman }));
        break;
      case SLOT_TYPE_TEAR:
        if (isSlot(TEAR_SLOTS, editSlot))
          dispatch(updateTear({ id: editSlot, item: item as Goods }));
        break;
      case SLOT_TYPE_WEAPON:
        if (isSlot(WEAPON_SLOTS, editSlot))
          dispatch(updateWeapon({ id: editSlot, item: item as Weapon }));
        if (item && hasWeaponOptions(item as Weapon)) {
          goTo('weapon');
          return;
        }
        break;
      default:
        break;
    }
    handleClose();
  };

  if (slotType === null) return null;

  if (step === 'weapon' && currentItem) {
    // The weapon step only opens on a weapon slot that holds a weapon.
    const weapon = currentItem as Weapon;
    const typeName = weaponTypes.find((type) => type.id === weapon.type)?.name;
    return (
      <Dialog title="Ash of War and affinity" onClose={handleClose} width={560}>
        <WeaponStep ref={bodyRef}>
          <Chosen>
            <ItemTile src={iconUrl(weapon.icon)} size={64} />
            <span>
              <ChosenName>{weapon.name}</ChosenName>
              {typeName ? <Muted>{typeName}</Muted> : null}
            </span>
          </Chosen>
          <WeaponOptions />
          <StepActions>
            <Button variant="secondary" onClick={() => goTo('list')}>
              Change weapon
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </StepActions>
        </WeaponStep>
      </Dialog>
    );
  }

  const item = (option: SlotItem) => {
    const conflict =
      slotType === SLOT_TYPE_TAL ? talismanConflict(option as Talisman, otherTalismans) : undefined;
    const current = currentItem?.id === option.id;
    return (
      <li key={option.id}>
        <Option
          type="button"
          aria-current={current ? 'true' : undefined}
          aria-disabled={conflict ? true : undefined}
          onClick={conflict ? undefined : handleSelectItem(option)}>
          <ItemTile src={iconUrl(option.icon)} size={48} />
          <OptionText>
            {option.name}
            {conflict ? (
              <Note>
                {conflict.id === option.id ? 'Already worn' : `Can't be worn with ${conflict.name}`}
              </Note>
            ) : null}
            {slotType === SLOT_TYPE_SPELL ? <Note>{slotsText(option as Spell)}</Note> : null}
          </OptionText>
        </Option>
      </li>
    );
  };

  const filtered =
    filters.search ||
    filters.weaponType !== null ||
    filters.spellKind !== 'all' ||
    filters.dlc !== 'all';

  return (
    <Dialog title={TITLES[slotType]} onClose={handleClose} width={960} tall>
      <Body ref={bodyRef}>
        <Toolbar>
          <Search>
            <TextInput
              type="search"
              aria-label="Search items"
              onChange={(search) => setFilter({ search })}
              placeholder="Search by name"
              value={filters.search}
            />
          </Search>
          {slotType === SLOT_TYPE_WEAPON ? (
            <TypeFilter>
              <DropDown
                label="Weapon type"
                onChange={(value) =>
                  setFilter({ weaponType: value === null ? null : Number(value) })
                }
                options={WEAPON_TYPE_OPTIONS}
                placeholder="All weapon types"
                value={filters.weaponType === null ? '' : String(filters.weaponType)}
              />
            </TypeFilter>
          ) : null}
          {slotType === SLOT_TYPE_SPELL ? (
            <SegmentedControl
              label="Spell kind"
              options={SPELL_KINDS}
              value={filters.spellKind}
              onChange={(spellKind) => setFilter({ spellKind })}
            />
          ) : null}
          <SegmentedControl
            label="Base game or DLC"
            options={DLC_OPTIONS}
            value={filters.dlc}
            onChange={(dlc) => setFilter({ dlc })}
          />
        </Toolbar>
        <Status>
          <Count aria-live="polite">
            {options.length === 1 ? '1 item' : `${options.length} items`}
          </Count>
          {filtered ? (
            <TextButton
              onClick={() => {
                setFilters(NO_FILTERS);
                setVisibleCount(PAGE_SIZE);
              }}>
              Clear filters
            </TextButton>
          ) : null}
          {currentItem ? (
            <Current>
              <Muted>Current: {currentItem.name}</Muted>
              {slotType === SLOT_TYPE_WEAPON ? (
                <TextButton onClick={() => goTo('weapon')}>Ash of War and affinity</TextButton>
              ) : null}
              <Button variant="danger" onClick={handleSelectItem(null)}>
                Remove {currentItem.name}
              </Button>
            </Current>
          ) : null}
        </Status>
        <List>
          {options.length === 0 ? <Empty>Nothing matches. Try another search.</Empty> : null}
          <Options>{options.slice(0, visibleCount).map(item)}</Options>
          {options.length > visibleCount ? (
            <ShowMore>
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                Show more ({options.length - visibleCount} left)
              </Button>
            </ShowMore>
          ) : null}
        </List>
      </Body>
    </Dialog>
  );
}

/** Rows rendered at a time. */
const PAGE_SIZE = 60;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
`;

const Toolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
`;

const Search = styled.div`
  flex: 1 1 240px;
`;

const TypeFilter = styled.div`
  flex: 0 1 220px;

  @media ${BELOW_MOBILE} {
    flex: 1 1 100%;
  }
`;

const Status = styled.div`
  align-items: center;
  border-bottom: 1px solid ${COLOR_LINE};
  display: flex;
  flex-wrap: wrap;
  gap: 0 ${SPACE_SM};
  padding: ${SPACE_XS} 0;
`;

const Count = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
`;

const Current = styled.span`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0 ${SPACE_SM};
  margin-left: auto;
  min-width: 0;

  & > button:last-child {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Muted = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: block;
  font-size: ${TEXT_SM};
`;

// The scrolling part: the toolbar and status stay put above it.
const List = styled.div`
  flex: 1;
  margin: 0 -${SPACE_SM};
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: ${SPACE_SM};
`;

const Options = styled.ul`
  display: grid;
  gap: 2px ${SPACE_SM};
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Option = styled.button`
  ${selectionBar}
  align-items: center;
  background: none;
  border: 1px solid transparent;
  color: ${COLOR_TEXT};
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: ${TEXT_SM};
  font-weight: 600;
  gap: 12px;
  min-height: 58px;
  padding: 4px 6px;
  position: relative;
  text-align: left;
  width: 100%;

  &[aria-current='true'] {
    background: linear-gradient(90deg, ${COLOR_GLOW}, transparent 80%);
    border-color: ${COLOR_FRAME};
  }

  &[aria-current='true'] > span:first-child {
    border-color: ${COLOR_ACCENT};
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const OptionText = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const Note = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-weight: 400;
`;

const Empty = styled.p`
  color: ${COLOR_TEXT_MUTED};
  margin: ${SPACE_MD} 0;
  text-align: center;
`;

const ShowMore = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${SPACE_MD};
`;

const WeaponStep = styled.div`
  display: grid;
  gap: ${SPACE_MD};
`;

const Chosen = styled.div`
  align-items: center;
  display: flex;
  gap: ${SPACE_MD};
`;

const ChosenName = styled.span`
  display: block;
  font-size: ${TEXT_MD};
  font-weight: 600;
`;

const StepActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  justify-content: flex-end;
`;

export default ItemSelector;
