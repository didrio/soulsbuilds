import { useMemo, useState } from 'react';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import FlexItem from '@/components/ui/FlexItem';
import TextInput from '@/components/ui/TextInput';
import CloseButton from '@/components/ui/CloseButton';
import DropDown from '@/components/ui/DropDown';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  affinities,
  armorList,
  arrows,
  consumables,
  skillNames,
  spells,
  talismans,
  tears,
  weapons,
  type Armor,
  type Arrow,
  type Consumable,
  type SlotItem,
  type Spell,
  type Talisman,
  type Tear,
  type Weapon,
} from '@/data';
import { sortBy } from '@/lib/array';
import { COLOR_GOLD, COLOR_GREEN, COLOR_LIGHT_GREEN, BELOW_750, BELOW_1000 } from '@/theme';
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
  SLOT_TYPE_HELM,
  SLOT_TYPE_LEG,
  SLOT_TYPE_SPELL,
  SLOT_TYPE_TAL,
  SLOT_TYPE_TEAR,
  SLOT_TYPE_WEAPON,
  isSlot,
  type SlotType,
} from './slots';
import {
  updateEditSlot,
  updateSlotType,
  updateEditSubSlot,
  updateEditAffinitySlot,
} from './store/app';
import {
  updateHelm,
  updateLeg,
  updateChest,
  updateGauntlet,
  updateArrow,
  updateCon,
  updateTal,
  updateWeapon,
  updateWeaponAffinity,
  updateWeaponSkill,
} from './store/equipment';
import { updateSpell } from './store/spells';
import { updateTear } from './store/tears';
import {
  selectEditAffinitySlot,
  selectEditSlot,
  selectSlotType,
  selectEditSubSlot,
  selectEditWeaponAffinity,
  selectEditWeaponSkill,
} from './store/selectors';

const itemsForSlotType = (slotType: SlotType | null): readonly SlotItem[] => {
  switch (slotType) {
    case SLOT_TYPE_ARROW:
      return arrows;
    case SLOT_TYPE_CHEST:
      return armorList('chests');
    case SLOT_TYPE_CON:
      return consumables;
    case SLOT_TYPE_GAUNTLET:
      return armorList('gauntlets');
    case SLOT_TYPE_HELM:
      return armorList('helms');
    case SLOT_TYPE_LEG:
      return armorList('legs');
    case SLOT_TYPE_SPELL:
      return spells;
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

/**
 * The item picker modal: a searchable list of items for the slot type being edited (plus affinity
 * and skill dropdowns for weapons). Picking an item writes it to the slot and closes the picker.
 */
function ItemSelector() {
  const [searchText, setSearchText] = useState('');

  const dispatch = useAppDispatch();
  const editAffinitySlot = useAppSelector(selectEditAffinitySlot);
  const editSlot = useAppSelector(selectEditSlot);
  const editSubSlot = useAppSelector(selectEditSubSlot);
  const editWeaponSkill = useAppSelector(selectEditWeaponSkill);
  const editWeaponAffinity = useAppSelector(selectEditWeaponAffinity);
  const slotType = useAppSelector(selectSlotType);

  const handleClose = () => {
    dispatch(updateEditSlot(null));
    dispatch(updateEditSubSlot(null));
    dispatch(updateEditAffinitySlot(null));
    dispatch(updateSlotType(null));
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

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // The item list matches the slot type, so the casts below narrow to what the list holds.
  const handleSelectItem = (item: SlotItem) => () => {
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
          dispatch(updateCon({ id: editSlot, item: item as Consumable }));
        break;
      case SLOT_TYPE_GAUNTLET:
        dispatch(updateGauntlet(item as Armor));
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
      case SLOT_TYPE_TAL:
        if (isSlot(TALISMAN_SLOTS, editSlot))
          dispatch(updateTal({ id: editSlot, item: item as Talisman }));
        break;
      case SLOT_TYPE_TEAR:
        if (isSlot(TEAR_SLOTS, editSlot))
          dispatch(updateTear({ id: editSlot, item: item as Tear }));
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

  const handleSkillChange = (value: string) => {
    if (editSubSlot) dispatch(updateWeaponSkill({ id: editSubSlot, item: value }));
  };

  const handleAffinityChange = (value: string) => {
    if (editAffinitySlot) dispatch(updateWeaponAffinity({ id: editAffinitySlot, item: value }));
  };

  const getItem = (item: SlotItem) => (
    <RowContainer key={item.name} onClick={handleSelectItem(item)}>
      <RowName>
        <ImageContainer>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={`/assets/${item.imageUrl}`} />
        </ImageContainer>
        <FlexItem>{item.name}</FlexItem>
      </RowName>
      {'slot' in item && item.slot ? <SlotContainer>{item.slot}</SlotContainer> : null}
    </RowContainer>
  );

  return (
    <Container>
      <TopBar>
        <SearchContainer>
          <TextInput onChange={handleSearch} placeholder="Search" value={searchText} />
        </SearchContainer>
        <CloseButton onClick={handleClose} />
      </TopBar>
      {slotType === SLOT_TYPE_WEAPON ? (
        <SkillContainer>
          <SkillLabel>Add Affinity</SkillLabel>
          <SkillDropDown>
            <DropDown
              onChange={handleAffinityChange}
              options={affinities}
              placeholder="-- Choose an Affinity --"
              value={editWeaponAffinity || ''}
            />
          </SkillDropDown>
          <SkillLabel>Add Skill</SkillLabel>
          <SkillDropDown>
            <DropDown
              onChange={handleSkillChange}
              options={skillNames}
              placeholder="-- Choose a Skill --"
              value={editWeaponSkill || ''}
            />
          </SkillDropDown>
        </SkillContainer>
      ) : null}
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

const SkillContainer = styled(FlexGroup)`
  margin-bottom: 10px;
  margin-top: 10px;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

const SkillLabel = styled(FlexGroup)`
  font-size: 16px;
  font-weight: bold;
  margin-right: 20px;
`;

const SkillDropDown = styled(FlexGroup)`
  margin-right: 20px;
  width: 200px;
`;

const TopBar = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  width: 100%;
`;

const RowContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: space-between;
  height: 80px;
  min-height: 80px;
  background-color: ${COLOR_GREEN};
  margin: 5px 0;
  margin-right: 10px;
  cursor: pointer;
  padding: 0 10px;
  border-radius: 2px;
  width: 250px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }
`;

const RowName = styled(FlexGroup)`
  align-items: center;

  & > div {
    margin-right: 10px;
  }
`;

const SlotContainer = styled(FlexGroup)`
  font-weight: bold;
  margin-right: 30px;
`;

const ImageContainer = styled(FlexGroup)`
  min-width: 60px;
  min-height: 60px;
  height: 60px;
  width: 60px;
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
