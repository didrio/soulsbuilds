import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import concat from 'lodash/concat';
import sortBy from 'lodash/sortBy';
import FlexGroup from './common/FlexGroup';
import FlexItem from './common/FlexItem';
import TextInput from './common/TextInput';
import { updateEditSlot, updateSlotType } from '../store/app';
import {
  updateHelm,
  updateLeg,
  updateChest,
  updateGauntlet,
  updateArrow,
  updateCon,
  updateTal,
  updateWeapon,
} from '../store/equipment';
import { updateSpell } from '../store/spells';
import { updateTear } from '../store/tears';
import { selectEditSlot, selectSlotType } from '../store/selectors';
import {
  COLOR_BLACK,
  COLOR_DARK_GRAY,
  COLOR_LIGHT_GRAY,
  COLOR_GRAY,
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
import shields from '../data/shields.json';
import talismans from '../data/talismans.json';
import weapons from '../data/weapons.json';
import spells from '../data/spells.json';
import tears from '../data/tears.json';

function ItemSelector() {
  const [searchText, setSearchText] = useState('');

  const dispatch = useDispatch();
  const editSlot = useSelector(selectEditSlot);
  const slotType = useSelector(selectSlotType);

  const handleClose = () => {
    dispatch(updateEditSlot(null));
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
        items = [
          ...concat(...Object.values(weapons)),
          ...concat(...Object.values(shields)),
        ];
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

  const row = (item) => (
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
        <IconContainer
          onClick={handleClose}
        />
      </TopBar>
      <Contents>
        {options.map((option) => row(option))}
      </Contents>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  color: ${COLOR_BLACK};
  flex-direction: column;
  height: 100%;
`;

const TopBar = styled(FlexGroup)`
  justify-content: space-between;
  margin-bottom: 10px;
  width: 100%;
`;

const IconContainer = styled(FlexGroup)`
  background-color: #000000;
  cursor: pointer;
  height: 35px;
  width: 35px;
`;

const RowContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: space-between;
  height: 80px;
  min-height: 80px;
  background-color: ${COLOR_DARK_GRAY};
  margin: 5px 0;
  cursor: pointer;
  color: ${COLOR_LIGHT_GRAY};
  padding: 0 10px;
  border-radius: 10px;

  &:hover {
    background-color: ${COLOR_GRAY};
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
  flex-direction: column;
  overflow: scroll;
  height: 100%;
`;

const SearchContainer = styled(FlexGroup)`
  width: 250px;
`;

export default ItemSelector;
