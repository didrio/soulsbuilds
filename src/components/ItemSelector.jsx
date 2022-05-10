import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import sortBy from 'lodash/sortBy';
import FlexGroup from './common/FlexGroup';
import FlexItem from './common/FlexItem';
import TextInput from './common/TextInput';
import CloseButton from './common/CloseButton';
import DropDown from './common/DropDown';
import {
  updateEditSlot,
  updateSlotType,
  updateEditSubSlot,
  updateEditAffinitySlot,
} from '../store/app';
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
} from '../store/equipment';
import { updateSpell } from '../store/spells';
import { updateTear } from '../store/tears';
import {
  selectEditAffinitySlot,
  selectEditSlot,
  selectSlotType,
  selectEditSubSlot,
  selectEditWeaponAffinity,
  selectEditWeaponSkill,
} from '../store/selectors';
import {
  COLOR_GOLD,
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
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
} from '../constants';
import armor from '../data/armor.json';
import arrowsAndBolts from '../data/arrowsAndBolts.json';
import consumables from '../data/consumables.json';
import weaponsAndShieldsData from '../data/weaponsAndShields.json';
import talismans from '../data/talismans.json';
import spells from '../data/spells.json';
import tears from '../data/tears.json';
import skills from '../data/skillsIndexed.json';
import affinitiesData from '../data/affinities.json';

const skillsOptions = Object.values(skills).map(({ name }) => name).sort();
const { affinities } = affinitiesData;

function ItemSelector() {
  const [searchText, setSearchText] = useState('');

  const dispatch = useDispatch();
  const editAffinitySlot = useSelector(selectEditAffinitySlot);
  const editSlot = useSelector(selectEditSlot);
  const editSubSlot = useSelector(selectEditSubSlot);
  const editWeaponSkill = useSelector(selectEditWeaponSkill);
  const editWeaponAffinity = useSelector(selectEditWeaponAffinity);
  const slotType = useSelector(selectSlotType);

  const handleClose = () => {
    dispatch(updateEditSlot(null));
    dispatch(updateEditSubSlot(null));
    dispatch(updateEditAffinitySlot(null));
    dispatch(updateSlotType(null));
  };

  const options = useMemo(() => {
    let items;
    switch (slotType) {
      case SLOT_TYPE_ARROW:
        items = arrowsAndBolts;
        break;
      case SLOT_TYPE_CHEST:
        items = armor.chests;
        break;
      case SLOT_TYPE_CON:
        items = consumables;
        break;
      case SLOT_TYPE_GAUNTLET:
        items = armor.gauntlets;
        break;
      case SLOT_TYPE_HELM:
        items = armor.helms;
        break;
      case SLOT_TYPE_LEG:
        items = armor.legs;
        break;
      case SLOT_TYPE_SPELL:
        items = spells;
        break;
      case SLOT_TYPE_TAL:
        items = talismans;
        break;
      case SLOT_TYPE_TEAR:
        items = tears;
        break;
      case SLOT_TYPE_WEAPON:
        items = Object.values(weaponsAndShieldsData);
        break;
      default:
        break;
    }
    let sortedItems = sortBy(items, ({ name }) => name);
    if (searchText) {
      sortedItems = sortedItems.filter(({ name }) => (
        name.toLowerCase().includes(searchText.toLowerCase())
      ));
    }
    return sortedItems;
  }, [slotType, searchText]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleSelectItem = (item) => () => {
    switch (slotType) {
      case SLOT_TYPE_ARROW:
        dispatch(updateArrow({ id: editSlot, item }));
        break;
      case SLOT_TYPE_CHEST:
        dispatch(updateChest(item));
        break;
      case SLOT_TYPE_CON:
        dispatch(updateCon({ id: editSlot, item }));
        break;
      case SLOT_TYPE_GAUNTLET:
        dispatch(updateGauntlet(item));
        break;
      case SLOT_TYPE_HELM:
        dispatch(updateHelm(item));
        break;
      case SLOT_TYPE_LEG:
        dispatch(updateLeg(item));
        break;
      case SLOT_TYPE_SPELL:
        dispatch(updateSpell({ id: editSlot, item }));
        break;
      case SLOT_TYPE_TAL:
        dispatch(updateTal({ id: editSlot, item }));
        break;
      case SLOT_TYPE_TEAR:
        dispatch(updateTear({ id: editSlot, item }));
        break;
      case SLOT_TYPE_WEAPON:
        dispatch(updateWeapon({ id: editSlot, item }));
        break;
      default:
        break;
    }
    handleClose();
  };

  const handleSkillChange = (value) => {
    dispatch(updateWeaponSkill({ id: editSubSlot, item: value }));
  };

  const handleAffinityChange = (value) => {
    console.log('editAffinitySlot', editAffinitySlot);
    console.log('value', value);
    dispatch(updateWeaponAffinity({ id: editAffinitySlot, item: value }));
  };

  console.log('editWeaponAffinity', editWeaponAffinity);

  const getItem = (item) => (
    <RowContainer
      key={item.name}
      onClick={handleSelectItem(item)}
    >
      <RowName>
        <ImageContainer>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={`/assets/${item.imageUrl}`}
          />
        </ImageContainer>
        <FlexItem>
          {item.name}
        </FlexItem>
      </RowName>
      {!item.slot ? null : (
        <SlotContainer>
          {item.slot}
        </SlotContainer>
      )}
    </RowContainer>
  );

  return (
    <Container>
      <TopBar>
        <SearchContainer>
          <TextInput
            onChange={handleSearch}
            placeholder="Search"
            value={searchText}
          />
        </SearchContainer>
        <CloseButton
          onClick={handleClose}
        />
      </TopBar>
      {slotType === SLOT_TYPE_WEAPON ? (
        <SkillContainer>
          <SkillLabel>
            Add Affinity
          </SkillLabel>
          <SkillDropDown>
            <DropDown
              onChange={handleAffinityChange}
              options={affinities}
              placeholder="-- Choose an Affinity --"
              value={editWeaponAffinity || ''}
            />
          </SkillDropDown>
          <SkillLabel>
            Add Skill
          </SkillLabel>
          <SkillDropDown>
            <DropDown
              onChange={handleSkillChange}
              options={skillsOptions}
              placeholder="-- Choose a Skill --"
              value={editWeaponSkill || ''}
            />
          </SkillDropDown>
        </SkillContainer>
      ) : null}
      <Contents>
        {options.map((option) => getItem(option))}
      </Contents>
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

  @media only screen and (max-width: 1000px) {
    width: 350px;
  }

  @media only screen and (max-width: 750px) {
    width: 230px;
  }
`;

export default ItemSelector;
