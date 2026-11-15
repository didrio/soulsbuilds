import { useState } from 'react';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getSkill, type SlotItem } from '@/data';
import {
  COLOR_LIGHT_GOLD,
  COLOR_DARK_GOLD,
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_DARK_GREEN,
  COLOR_TEXT_SHADOW,
  BELOW_400,
  BELOW_500,
  BELOW_1400,
} from '@/theme';
import type { ItemSlot, SlotType, WeaponAffinitySlot, WeaponSkillSlot } from './slots';
import {
  updateEditSlot,
  updateSlotType,
  updateEditSubSlot,
  updateEditAffinitySlot,
} from './store/app';
import { selectEquipment } from './store/selectors';

const SLOT_SIZE = '80px';
const SLOT_SIZE_SMALL = '60px';
const SLOT_SIZE_XSMALL = '50px';
const SLOT_SIZE_XXSMALL = '40px';

interface SlotProps {
  /** Affinity name to show (display-only slots). Wins over `affinityId`. */
  affinity?: string | null;
  /** Editor affinity slot this weapon slot reads and the picker edits. */
  affinityId?: WeaponAffinitySlot | '';
  /** Placeholder icon: public/assets/menu/<background>.png. */
  background?: string;
  disabled?: boolean;
  /** Editor slot the picker writes to. */
  id?: ItemSlot | '';
  item?: SlotItem | null;
  onRemove?: () => void;
  size?: string | null;
  /** Editor weapon-skill slot this weapon slot reads and the picker edits. */
  subId?: WeaponSkillSlot | '';
  /** Skill name to show (display-only slots). Wins over `subId`. */
  subItem?: string | null;
  type: SlotType;
}

/**
 * One equipment/spell slot. Empty and enabled: click opens the item picker for `id`. Filled and
 * enabled: click removes the item (T6: change in place). Shows hover badges for affinity and skill.
 */
function Slot({
  affinity = '',
  affinityId = '',
  background = '',
  disabled = false,
  id = '',
  item = null,
  onRemove = () => {},
  size = null,
  subId = '',
  subItem = null,
  type,
}: SlotProps) {
  const dispatch = useAppDispatch();
  const equipment = useAppSelector(selectEquipment);

  const [showWeaponAffinity, setShowWeaponAffinity] = useState(false);
  const [showWeaponSkill, setShowWeaponSkill] = useState(false);

  const hasItem = item !== null;
  const backgroundColor = hasItem ? COLOR_DARK_GOLD : COLOR_GREEN;
  const hoverColor = hasItem ? COLOR_LIGHT_GOLD : COLOR_LIGHT_GREEN;

  const handleClick = () => {
    if (!disabled && !hasItem) {
      dispatch(updateEditSlot(id || null));
      dispatch(updateSlotType(type));
      if (affinityId) {
        dispatch(updateEditAffinitySlot(affinityId));
      }
      if (subId) {
        dispatch(updateEditSubSlot(subId));
      }
    } else if (!disabled && hasItem) {
      onRemove();
    }
  };

  const weaponSkillName = subItem || (subId ? equipment[subId] : null);
  const weaponAffinity = affinity || (affinityId ? equipment[affinityId] : null);
  const weaponSkill = getSkill(weaponSkillName);

  const handleShowWeaponSkill = () => {
    setShowWeaponSkill(true);
  };

  const handleHideWeaponSkill = () => {
    setShowWeaponSkill(false);
  };

  const handleShowWeaponAffinity = () => {
    setShowWeaponAffinity(true);
  };

  const handleHideWeaponAffinity = () => {
    setShowWeaponAffinity(false);
  };

  return (
    <Container
      $background={background}
      $backgroundColor={backgroundColor}
      $disabled={disabled}
      $hasItem={hasItem}
      $hoverColor={hoverColor}
      $size={size}
      onClick={handleClick}>
      {!hasItem ? null : (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={`/assets/${item.imageUrl}`} />
      )}
      {!hasItem ? null : <NameContainer>{item.name}</NameContainer>}
      {weaponAffinity ? (
        <WeaponAffinityIconContainer
          onMouseEnter={handleShowWeaponAffinity}
          onMouseLeave={handleHideWeaponAffinity}>
          A
        </WeaponAffinityIconContainer>
      ) : null}
      {weaponSkill ? (
        <WeaponSkillIconContainer
          onMouseEnter={handleShowWeaponSkill}
          onMouseLeave={handleHideWeaponSkill}>
          S
        </WeaponSkillIconContainer>
      ) : null}
      {weaponSkill && showWeaponSkill ? (
        <WeaponSkillContainer vertical>
          <FlexGroup>
            <WeaponSkillLabel>Weapon Skill:</WeaponSkillLabel>
            <WeaponSkillValue>{weaponSkill.name}</WeaponSkillValue>
          </FlexGroup>
          <FlexGroup>
            <WeaponSkillLabel>Effect:</WeaponSkillLabel>
            <WeaponSkillValue>{weaponSkill.effect}</WeaponSkillValue>
          </FlexGroup>
          <FlexGroup>
            <WeaponSkillLabel>FP:</WeaponSkillLabel>
            <WeaponSkillValue>{weaponSkill.fp}</WeaponSkillValue>
          </FlexGroup>
        </WeaponSkillContainer>
      ) : null}
      {weaponAffinity && showWeaponAffinity ? (
        <WeaponSkillContainer vertical>
          <FlexGroup>
            <WeaponSkillLabel>Weapon Affinity:</WeaponSkillLabel>
            <WeaponSkillValue>{weaponAffinity}</WeaponSkillValue>
          </FlexGroup>
        </WeaponSkillContainer>
      ) : null}
    </Container>
  );
}

interface ContainerProps {
  $background: string;
  $backgroundColor: string;
  $disabled: boolean;
  $hasItem: boolean;
  $hoverColor: string;
  $size: string | null;
}

const Container = styled(FlexGroup)<ContainerProps>`
  align-items: center;
  justify-content: center;
  background-color: ${({ $backgroundColor }) => $backgroundColor};
  border-radius: 2px;
  cursor: ${({ $disabled }) => ($disabled ? 'auto' : 'pointer')};
  height: ${({ $size }) => ($size === null ? SLOT_SIZE : $size)};
  width: ${({ $size }) => ($size === null ? SLOT_SIZE : $size)};
  position: relative;
  transition: background-color 0.1s ease-in-out;

  &::before {
    content: '';
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    background-image: ${({ $background, $hasItem }) => ($hasItem ? 'none' : `url("/assets/menu/${$background}.png")`)};
    background-size: auto 80%;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 1;
    box-shadow: 0px 0px 3px ${COLOR_GREEN};
  }

  &:hover {
    background-color: ${({ $backgroundColor, $disabled, $hoverColor }) => ($disabled ? $backgroundColor : $hoverColor)};
  }

  & > img {
    height: 85%;
    width: 85%;
  }

  @media ${BELOW_1400} {
    height: ${SLOT_SIZE_SMALL};
    width: ${SLOT_SIZE_SMALL};
  }

  @media ${BELOW_500} {
    height: ${SLOT_SIZE_XSMALL};
    width: ${SLOT_SIZE_XSMALL};
  }

  @media ${BELOW_400} {
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
  text-shadow: 0px 0px 5px ${COLOR_TEXT_SHADOW};
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

const WeaponAffinityIconContainer = styled(WeaponSkillIconContainer)`
  left: 2px;
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

export default Slot;
