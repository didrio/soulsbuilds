import { useSelector } from 'react-redux';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import FlexGroup from './common/FlexGroup';
import Slot from './common/Slot';
import {
  SLOT_TYPE_ARROW,
  SLOT_TYPE_CHEST,
  SLOT_TYPE_CON,
  SLOT_TYPE_GAUNTLET,
  SLOT_TYPE_HELM,
  SLOT_TYPE_LEG,
  SLOT_TYPE_TAL,
  SLOT_TYPE_WEAPON,
} from '../constants';
import {
  selectHelm,
  selectLeg,
  selectChest,
  selectGauntlet,
  selectArrow1,
  selectArrow2,
  selectArrow3,
  selectArrow4,
  selectCon1,
  selectCon2,
  selectCon3,
  selectCon4,
  selectCon5,
  selectCon6,
  selectCon7,
  selectCon8,
  selectCon9,
  selectCon10,
  selectTal1,
  selectTal2,
  selectTal3,
  selectTal4,
  selectWeapon1,
  selectWeapon2,
  selectWeapon3,
  selectWeapon4,
  selectWeapon5,
  selectWeapon6,
} from '../store/selectors';

function EquipmentEditor({ editable }) {
  const helm = useSelector(selectHelm);
  const leg = useSelector(selectLeg);
  const chest = useSelector(selectChest);
  const gauntlet = useSelector(selectGauntlet);
  const arrow1 = useSelector(selectArrow1);
  const arrow2 = useSelector(selectArrow2);
  const arrow3 = useSelector(selectArrow3);
  const arrow4 = useSelector(selectArrow4);
  const con1 = useSelector(selectCon1);
  const con2 = useSelector(selectCon2);
  const con3 = useSelector(selectCon3);
  const con4 = useSelector(selectCon4);
  const con5 = useSelector(selectCon5);
  const con6 = useSelector(selectCon6);
  const con7 = useSelector(selectCon7);
  const con8 = useSelector(selectCon8);
  const con9 = useSelector(selectCon9);
  const con10 = useSelector(selectCon10);
  const tal1 = useSelector(selectTal1);
  const tal2 = useSelector(selectTal2);
  const tal3 = useSelector(selectTal3);
  const tal4 = useSelector(selectTal4);
  const weapon1 = useSelector(selectWeapon1);
  const weapon2 = useSelector(selectWeapon2);
  const weapon3 = useSelector(selectWeapon3);
  const weapon4 = useSelector(selectWeapon4);
  const weapon5 = useSelector(selectWeapon5);
  const weapon6 = useSelector(selectWeapon6);

  return (
    <FlexGroup
      vertical
    >
      <Header>
        Equipment
      </Header>
      <SubHeader>
        Main Hand
      </SubHeader>
      <SlotContainer>
        <Slot
          background="weapon"
          disabled={!editable}
          id="weapon1"
          item={weapon1}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="weapon"
          disabled={!editable}
          id="weapon2"
          item={weapon2}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="weapon"
          disabled={!editable}
          id="weapon3"
          item={weapon3}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="arrow"
          disabled={!editable}
          id="arrow1"
          item={arrow1}
          type={SLOT_TYPE_ARROW}
        />
        <Slot
          background="arrow"
          editable={editable}
          id="arrow2"
          item={arrow2}
          type={SLOT_TYPE_ARROW}
        />
      </SlotContainer>
      <SubHeader>
        Off Hand
      </SubHeader>
      <SlotContainer>
        <Slot
          background="shield"
          disabled={!editable}
          id="weapon4"
          item={weapon4}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="shield"
          disabled={!editable}
          id="weapon5"
          item={weapon5}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="shield"
          disabled={!editable}
          id="weapon6"
          item={weapon6}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="bolt"
          disabled={!editable}
          id="arrow3"
          item={arrow3}
          type={SLOT_TYPE_ARROW}
        />
        <Slot
          background="bolt"
          disabled={!editable}
          id="arrow4"
          item={arrow4}
          type={SLOT_TYPE_ARROW}
        />
      </SlotContainer>
      <SubHeader>
        Gear
      </SubHeader>
      <SlotContainer>
        <Slot
          background="helm"
          disabled={!editable}
          id="helm"
          item={helm}
          type={SLOT_TYPE_HELM}
        />
        <Slot
          background="chest"
          disabled={!editable}
          id="chest"
          item={chest}
          type={SLOT_TYPE_CHEST}
        />
        <Slot
          background="gauntlet"
          disabled={!editable}
          id="gauntlet"
          item={gauntlet}
          type={SLOT_TYPE_GAUNTLET}
        />
        <Slot
          background="leg"
          disabled={!editable}
          id="leg"
          item={leg}
          type={SLOT_TYPE_LEG}
        />
      </SlotContainer>
      <SubHeader>
        Talismans
      </SubHeader>
      <SlotContainer>
        <Slot
          background="talisman"
          disabled={!editable}
          id="tal1"
          item={tal1}
          type={SLOT_TYPE_TAL}
        />
        <Slot
          background="talisman"
          disabled={!editable}
          id="tal2"
          item={tal2}
          type={SLOT_TYPE_TAL}
        />
        <Slot
          background="talisman"
          disabled={!editable}
          id="tal3"
          item={tal3}
          type={SLOT_TYPE_TAL}
        />
        <Slot
          background="talisman"
          disabled={!editable}
          id="tal4"
          item={tal4}
          type={SLOT_TYPE_TAL}
        />
      </SlotContainer>
      <SubHeader>
        Consumables
      </SubHeader>
      <SlotContainer>
        <Slot
          background="consumable"
          disabled={!editable}
          id="con1"
          item={con1}
          type={SLOT_TYPE_CON}
        />
        <Slot
          background="consumable"
          disabled={!editable}
          id="con2"
          item={con2}
          type={SLOT_TYPE_CON}
        />
        <Slot
          background="consumable"
          disabled={!editable}
          id="con3"
          item={con3}
          type={SLOT_TYPE_CON}
        />
        <Slot
          background="consumable"
          disabled={!editable}
          id="con4"
          item={con4}
          type={SLOT_TYPE_CON}
        />
        <Slot
          background="consumable"
          disabled={!editable}
          id="con5"
          item={con5}
          type={SLOT_TYPE_CON}
        />
      </SlotContainer>
      <SlotContainer>
        <Slot
          background="consumable"
          disabled={!editable}
          id="con6"
          item={con6}
          type={SLOT_TYPE_CON}
        />
        <Slot
          background="consumable"
          disabled={!editable}
          id="con7"
          item={con7}
          type={SLOT_TYPE_CON}
        />
        <Slot
          background="consumable"
          disabled={!editable}
          id="con8"
          item={con8}
          type={SLOT_TYPE_CON}
        />
        <Slot
          background="consumable"
          disabled={!editable}
          id="con9"
          item={con9}
          type={SLOT_TYPE_CON}
        />
        <Slot
          background="consumable"
          disabled={!editable}
          id="con10"
          item={con10}
          type={SLOT_TYPE_CON}
        />
      </SlotContainer>
    </FlexGroup>
  );
}

const Header = styled.h2`
  margin-bottom: 20px;
`;

const SubHeader = styled.h3`
  margin-bottom: 20px;
`;

const SlotContainer = styled(FlexGroup)`
  flex-wrap: wrap;

  & > div {
    margin-bottom: 10px;
    margin-right: 10px;
  }
`;

EquipmentEditor.propTypes = {
  editable: PropTypes.bool.isRequired,
};

export default EquipmentEditor;
