import { useMemo, useState } from 'react';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import FlexItem from '@/components/ui/FlexItem';
import TextInput from '@/components/ui/TextInput';
import CloseButton from '@/components/ui/CloseButton';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  armorList,
  arrows,
  consumables,
  greatRunes,
  iconUrl,
  spells,
  spiritAshes,
  talismanConflict,
  talismans,
  tears,
  weapons,
  type Armor,
  type Arrow,
  type Goods,
  type SlotItem,
  type Spell,
  type Talisman,
  type Weapon,
} from '@/data';
import { sortBy } from '@/lib/array';
import {
  COLOR_GOLD,
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  BELOW_750,
  BELOW_1000,
  COLOR_LIGHTEST_GREEN,
} from '@/theme';
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

/** Memory slots a spell takes, shown next to it. */
const slotsText = (spell: Spell) => `${spell.slots} ${spell.slots === 1 ? 'slot' : 'slots'}`;

/**
 * The item picker modal: a searchable list of items for the slot type being edited. Picking an item
 * writes it to the slot and closes the picker. For a weapon slot that holds a weapon it also offers
 * the weapon's Ash of War and affinity; talismans that can't be worn with one already worn say so.
 */
function ItemSelector() {
  const [searchText, setSearchText] = useState('');

  const dispatch = useAppDispatch();
  const editSlot = useAppSelector(selectEditSlot);
  const equipment = useAppSelector(selectEquipment);
  const slotType = useAppSelector(selectSlotType);
  const currentItem = useAppSelector(selectEditedItem);

  const handleClose = () => {
    dispatch(closePicker());
  };

  const options = useMemo(() => {
    let sortedItems = sortBy(itemsForSlotType(slotType), ({ name }) => name);
    if (searchText) {
      sortedItems = sortedItems.filter(({ name }) =>
        name.toLowerCase().includes(searchText.toLowerCase()),
      );
    }
    return sortedItems;
  }, [slotType, searchText]);

  // Talismans worn in the other slots: one of the same group can't be added.
  const otherTalismans =
    slotType === SLOT_TYPE_TAL
      ? TALISMAN_SLOTS.filter((slot) => slot !== editSlot).map((slot) => equipment[slot])
      : [];

  // The item list matches the slot type, so the casts below narrow to what the list holds.
  /** Puts `item` in the slot being edited (null empties it), then closes the picker. */
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
        break;
      default:
        break;
    }
    handleClose();
  };

  const getItem = (item: SlotItem) => {
    const conflict =
      slotType === SLOT_TYPE_TAL ? talismanConflict(item as Talisman, otherTalismans) : undefined;
    return (
      <RowContainer
        key={item.id}
        type="button"
        aria-disabled={conflict ? true : undefined}
        onClick={conflict ? undefined : handleSelectItem(item)}>
        <RowName>
          <ImageContainer>
            <img alt="" loading="lazy" decoding="async" src={iconUrl(item.icon)} />
          </ImageContainer>
          <FlexItem>
            {item.name}
            {conflict ? (
              <Note>
                {conflict.id === item.id ? 'Already worn' : `Can't be worn with ${conflict.name}`}
              </Note>
            ) : null}
          </FlexItem>
        </RowName>
        {slotType === SLOT_TYPE_SPELL ? (
          <SlotContainer>{slotsText(item as Spell)}</SlotContainer>
        ) : null}
      </RowContainer>
    );
  };

  return (
    <Container>
      <TopBar>
        <SearchContainer>
          <TextInput
            aria-label="Search items"
            onChange={setSearchText}
            placeholder="Search"
            value={searchText}
          />
        </SearchContainer>
        {currentItem ? (
          <RemoveButton type="button" onClick={handleSelectItem(null)}>
            Remove {currentItem.name}
          </RemoveButton>
        ) : null}
        <CloseButton onClick={handleClose} />
      </TopBar>
      {slotType === SLOT_TYPE_WEAPON ? <WeaponOptions /> : null}
      <Contents>{options.map((option) => getItem(option))}</Contents>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  color: ${COLOR_GOLD};
  flex-direction: column;
  height: 100%;
  font-size: 14px;
`;

const RemoveButton = styled.button`
  background: none;
  border: 1px solid ${COLOR_LIGHT_GREEN};
  color: inherit;
  cursor: pointer;
  font: inherit;
  margin-right: 15px;
  padding: 6px 12px;

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
    color: ${COLOR_LIGHTEST_GREEN};
  }
`;

const TopBar = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  width: 100%;
`;

const RowContainer = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  min-height: 80px;
  background-color: ${COLOR_GREEN};
  border: none;
  color: inherit;
  font: inherit;
  text-align: left;
  margin: 5px 0;
  margin-right: 10px;
  cursor: pointer;
  padding: 0 10px;
  border-radius: 2px;
  width: 250px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};

  &:hover:not([aria-disabled='true']) {
    background-color: ${COLOR_LIGHT_GREEN};
    color: ${COLOR_LIGHTEST_GREEN};
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${COLOR_GOLD};
  }
`;

const RowName = styled(FlexGroup)`
  align-items: center;

  & > div {
    margin-right: 10px;
  }
`;

const Note = styled.span`
  display: block;
  font-size: 12px;
  font-style: italic;
`;

const SlotContainer = styled(FlexGroup)`
  font-weight: bold;
  margin-right: 10px;
  white-space: nowrap;
`;

const ImageContainer = styled(FlexGroup)`
  min-width: 60px;
  min-height: 60px;
  height: 60px;
  width: 60px;

  & > img {
    height: 100%;
    width: 100%;
  }
`;

const Contents = styled(FlexGroup)`
  justify-content: center;
  overflow: scroll;
  flex-wrap: wrap;
`;

const SearchContainer = styled(FlexGroup)`
  margin-right: 20px;
  width: 450px;

  @media ${BELOW_1000} {
    width: 350px;
  }

  @media ${BELOW_750} {
    width: 230px;
  }
`;

export default ItemSelector;
