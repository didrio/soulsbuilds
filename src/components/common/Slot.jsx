/* eslint-disable prefer-destructuring */
import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import noop from 'lodash/noop';
import {
  COLOR_LIGHT_GOLD,
  COLOR_DARK_GOLD,
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  SLOT_TYPES,
  COLOR_DARK_GREEN,
} from '../../constants';
import {
  updateEditSlot,
  updateSlotType,
  updateEditSubSlot,
} from '../../store/app';
import FlexGroup from './FlexGroup';
import {
  selectWeaponSkills,
} from '../../store/selectors';
import skillsData from '../../data/skillsIndexed.json';

const SLOT_SIZE = '80px';
const SLOT_SIZE_SMALL = '60px';
const SLOT_SIZE_XSMALL = '50px';
const SLOT_SIZE_XXSMALL = '40px';

function Slot({
  background,
  disabled,
  id,
  item,
  onRemove,
  size,
  subId,
  subItem,
  type,
}) {
  const dispatch = useDispatch();
  const weaponSkills = useSelector(selectWeaponSkills);

  const [showWeaponSkill, setShowWeaponSkill] = useState(false);

  const hasItem = item !== null;
  const backgroundColor = hasItem ? COLOR_DARK_GOLD : COLOR_GREEN;
  const hoverColor = hasItem ? COLOR_LIGHT_GOLD : COLOR_LIGHT_GREEN;

  const handleClick = () => {
    if (!disabled && !hasItem) {
      dispatch(updateEditSlot(id));
      dispatch(updateSlotType(type));
      if (subId) {
        dispatch(updateEditSubSlot(subId));
      }
    } else if (!disabled && hasItem) {
      onRemove();
    }
  };

  const weaponSkillName = useMemo(() => {
    let skill = null;
    if (subItem) {
      return subItem;
    }
    if (!subId) {
      return skill;
    }
    switch (subId) {
      case 'weaponSkill1':
        skill = weaponSkills[0];
        break;
      case 'weaponSkill2':
        skill = weaponSkills[1];
        break;
      case 'weaponSkill3':
        skill = weaponSkills[2];
        break;
      case 'weaponSkill4':
        skill = weaponSkills[3];
        break;
      case 'weaponSkill5':
        skill = weaponSkills[4];
        break;
      case 'weaponSkill6':
        skill = weaponSkills[5];
        break;
      default:
        break;
    }
    return skill;
  }, [subId, weaponSkills, subItem]);

  const weaponSkill = skillsData[weaponSkillName];

  const handleShowWeaponSkill = () => {
    setShowWeaponSkill(true);
  };

  const handleHideWeaponSkill = () => {
    setShowWeaponSkill(false);
  };

  return (
    <Container
      background={background}
      backgroundColor={backgroundColor}
      disabled={disabled}
      hasItem={hasItem}
      hoverColor={hoverColor}
      onClick={handleClick}
      size={size}
    >
      {!hasItem ? null : (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={`/assets/${item.imageUrl}`}
        />
      )}
      {!hasItem ? null : (
        <NameContainer>
          {item.name}
        </NameContainer>
      )}
      {weaponSkill ? (
        <WeaponSkillIconContainer
          onMouseEnter={handleShowWeaponSkill}
          onMouseLeave={handleHideWeaponSkill}
        >
          S
        </WeaponSkillIconContainer>
      ) : null}
      {(weaponSkill && showWeaponSkill) ? (
        <WeaponSkillContainer
          vertical
        >
          <FlexGroup>
            <WeaponSkillLabel>
              Weapon Skill:
            </WeaponSkillLabel>
            <WeaponSkillValue>
              {weaponSkill.name}
            </WeaponSkillValue>
          </FlexGroup>
          <FlexGroup>
            <WeaponSkillLabel>
              Effect:
            </WeaponSkillLabel>
            <WeaponSkillValue>
              {weaponSkill.effect}
            </WeaponSkillValue>
          </FlexGroup>
          <FlexGroup>
            <WeaponSkillLabel>
              FP:
            </WeaponSkillLabel>
            <WeaponSkillValue>
              {weaponSkill.fp}
            </WeaponSkillValue>
          </FlexGroup>
        </WeaponSkillContainer>
      ) : null}
    </Container>
  );
}

const Container = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: 2px;
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};
  height: ${({ size }) => (size === null ? SLOT_SIZE : size)};
  width: ${({ size }) => (size === null ? SLOT_SIZE : size)};
  position: relative;
  transition: background-color .1s ease-in-out;

  &::before {
    content: "";
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    background-image: ${({ background, hasItem }) => (hasItem ? 'none' : `url("/assets/menu/${background}.png")`)};
    background-size: auto 80%;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 1;
    box-shadow: 0px 0px 3px ${COLOR_GREEN};
  }

  &:hover {
    background-color: ${({ backgroundColor, disabled, hoverColor }) => (disabled ? backgroundColor : hoverColor)};
  }

  & > img {
    height: 85%;
    width: 85%;
  }

  @media only screen and (max-width: 1400px) {
    height: ${SLOT_SIZE_SMALL};
    width: ${SLOT_SIZE_SMALL};
  }

  @media only screen and (max-width: 500px) {
    height: ${SLOT_SIZE_XSMALL};
    width: ${SLOT_SIZE_XSMALL};
  }

  @media only screen and (max-width: 400px) {
    height: ${SLOT_SIZE_XXSMALL};
    width: ${SLOT_SIZE_XXSMALL};
  }
`;

const NameContainer = styled.div`
  position: absolute;
  bottom: 5px;
  font-weight: bold;
  font-size: 12px;
  text-align: center;
  text-shadow: 0px 0px 5px rgba(0,0,0,1);
  z-index: 1;
`;

const WeaponSkillIconContainer = styled(FlexGroup)`
  position: absolute;
  right: 2px;
  top: 2px;
  background-color: ${COLOR_DARK_GREEN};
  height: 17px;
  width: 17px;
  border: 1px solid ${COLOR_LIGHT_GREEN};
  border-radius: 2px;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 2;
  cursor: default;

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }
`;

const WeaponSkillContainer = styled(FlexGroup)`
  position: absolute;
  right: -253px;
  top: 0px;
  width: 250px;
  background-color: ${COLOR_DARK_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  border-radius: 2px;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 5px;
  z-index: 3;
`;

const WeaponSkillLabel = styled(FlexGroup)`
  font-weight: bold;
  margin-right: 5px;
`;

const WeaponSkillValue = styled(FlexGroup)`
  text-align: center;
  font-weight: normal;
`;

Slot.propTypes = {
  background: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  item: PropTypes.objectOf(PropTypes.string),
  onRemove: PropTypes.func,
  size: PropTypes.string,
  subId: PropTypes.string,
  subItem: PropTypes.string,
  type: PropTypes.oneOf(SLOT_TYPES).isRequired,
};

Slot.defaultProps = {
  background: '',
  disabled: false,
  id: '',
  item: null,
  onRemove: noop,
  subId: '',
  subItem: null,
  size: null,
};

export default Slot;
