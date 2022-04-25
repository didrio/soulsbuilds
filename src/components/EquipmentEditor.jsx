import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import FlexGroup from './common/FlexGroup';
import Slot from './common/Slot';
import {
  COLOR_LIGHTEST_GREEN,
  SLOT_TYPE_ARROW,
  SLOT_TYPE_CHEST,
  // SLOT_TYPE_CON,
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
  // selectCon1,
  // selectCon2,
  // selectCon3,
  // selectCon4,
  // selectCon5,
  // selectCon6,
  // selectCon7,
  // selectCon8,
  // selectCon9,
  // selectCon10,
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
import {
  updateHelm,
  updateLeg,
  updateChest,
  updateGauntlet,
  updateArrow,
  // updateCon,
  updateTal,
  updateWeapon,
} from '../store/equipment';

function EquipmentEditor({ editable }) {
  const dispatch = useDispatch();

  const helm = useSelector(selectHelm);
  const leg = useSelector(selectLeg);
  const chest = useSelector(selectChest);
  const gauntlet = useSelector(selectGauntlet);
  const arrow1 = useSelector(selectArrow1);
  const arrow2 = useSelector(selectArrow2);
  const arrow3 = useSelector(selectArrow3);
  const arrow4 = useSelector(selectArrow4);
  // const con1 = useSelector(selectCon1);
  // const con2 = useSelector(selectCon2);
  // const con3 = useSelector(selectCon3);
  // const con4 = useSelector(selectCon4);
  // const con5 = useSelector(selectCon5);
  // const con6 = useSelector(selectCon6);
  // const con7 = useSelector(selectCon7);
  // const con8 = useSelector(selectCon8);
  // const con9 = useSelector(selectCon9);
  // const con10 = useSelector(selectCon10);
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

  const handleRemoveArrow = (id) => () => {
    dispatch(updateArrow({ id, item: null }));
  };

  const handleRemoveTal = (id) => () => {
    dispatch(updateTal({ id, item: null }));
  };

  const handleRemoveWeapon = (id) => () => {
    dispatch(updateWeapon({ id, item: null }));
  };

  const handleRemoveHelm = () => {
    dispatch(updateHelm(null));
  };

  const handleRemoveChest = () => {
    dispatch(updateChest(null));
  };

  const handleRemoveGauntlet = () => {
    dispatch(updateGauntlet(null));
  };

  const handleRemoveLeg = () => {
    dispatch(updateLeg(null));
  };

  return (
    <Container
      vertical
    >
      <HeaderContainer>
        <Header>
          Equipment
        </Header>
      </HeaderContainer>
      <HeaderContainer>
        <SubHeader>
          Main Hand
        </SubHeader>
      </HeaderContainer>
      <SlotContainer>
        <Slot
          background="weapon"
          disabled={!editable}
          id="weapon1"
          item={weapon1}
          onRemove={handleRemoveWeapon('weapon1')}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="weapon"
          disabled={!editable}
          id="weapon2"
          item={weapon2}
          onRemove={handleRemoveWeapon('weapon2')}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="weapon"
          disabled={!editable}
          id="weapon3"
          item={weapon3}
          onRemove={handleRemoveWeapon('weapon3')}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="arrow"
          disabled={!editable}
          id="arrow1"
          item={arrow1}
          onRemove={handleRemoveArrow('arrow1')}
          type={SLOT_TYPE_ARROW}
        />
        <Slot
          background="arrow"
          disabled={!editable}
          id="arrow2"
          item={arrow2}
          onRemove={handleRemoveArrow('arrow2')}
          type={SLOT_TYPE_ARROW}
        />
      </SlotContainer>
      <HeaderContainer>
        <SubHeader>
          Off Hand
        </SubHeader>
      </HeaderContainer>
      <SlotContainer>
        <Slot
          background="shield"
          disabled={!editable}
          id="weapon4"
          item={weapon4}
          onRemove={handleRemoveWeapon('weapon4')}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="shield"
          disabled={!editable}
          id="weapon5"
          item={weapon5}
          onRemove={handleRemoveWeapon('weapon5')}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="shield"
          disabled={!editable}
          id="weapon6"
          item={weapon6}
          onRemove={handleRemoveWeapon('weapon6')}
          type={SLOT_TYPE_WEAPON}
        />
        <Slot
          background="bolt"
          disabled={!editable}
          id="arrow3"
          item={arrow3}
          onRemove={handleRemoveArrow('arrow3')}
          type={SLOT_TYPE_ARROW}
        />
        <Slot
          background="bolt"
          disabled={!editable}
          id="arrow4"
          item={arrow4}
          onRemove={handleRemoveArrow('arrow4')}
          type={SLOT_TYPE_ARROW}
        />
      </SlotContainer>
      <HeaderContainer>
        <SubHeader>
          Gear
        </SubHeader>
      </HeaderContainer>
      <SlotContainer>
        <Slot
          background="helm"
          disabled={!editable}
          id="helm"
          item={helm}
          onRemove={handleRemoveHelm}
          type={SLOT_TYPE_HELM}
        />
        <Slot
          background="chest"
          disabled={!editable}
          id="chest"
          item={chest}
          onRemove={handleRemoveChest}
          type={SLOT_TYPE_CHEST}
        />
        <Slot
          background="gauntlet"
          disabled={!editable}
          id="gauntlet"
          item={gauntlet}
          onRemove={handleRemoveGauntlet}
          type={SLOT_TYPE_GAUNTLET}
        />
        <Slot
          background="leg"
          disabled={!editable}
          id="leg"
          item={leg}
          onRemove={handleRemoveLeg}
          type={SLOT_TYPE_LEG}
        />
      </SlotContainer>
      <HeaderContainer>
        <SubHeader>
          Talismans
        </SubHeader>
      </HeaderContainer>
      <SlotContainer>
        <Slot
          background="talisman"
          disabled={!editable}
          id="tal1"
          item={tal1}
          onRemove={handleRemoveTal('tal1')}
          type={SLOT_TYPE_TAL}
        />
        <Slot
          background="talisman"
          disabled={!editable}
          id="tal2"
          item={tal2}
          onRemove={handleRemoveTal('tal2')}
          type={SLOT_TYPE_TAL}
        />
        <Slot
          background="talisman"
          disabled={!editable}
          id="tal3"
          item={tal3}
          onRemove={handleRemoveTal('tal3')}
          type={SLOT_TYPE_TAL}
        />
        <Slot
          background="talisman"
          disabled={!editable}
          id="tal4"
          item={tal4}
          onRemove={handleRemoveTal('tal4')}
          type={SLOT_TYPE_TAL}
        />
      </SlotContainer>
      {/* <SubHeader>
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
      </SlotContainer> */}
    </Container>
  );
}

const Container = styled(FlexGroup)`
  justify-content: center;
`;

const HeaderContainer = styled(FlexGroup)`
  justify-content: center;
`;

const Header = styled.h2`
  color: ${COLOR_LIGHTEST_GREEN};
  margin-bottom: 20px;
  font-size: 26px;
`;

const SubHeader = styled.h3`
  margin-bottom: 20px;
`;

const SlotContainer = styled(FlexGroup)`
  justify-content: center;
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
