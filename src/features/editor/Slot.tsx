import { useState, type KeyboardEvent } from 'react';
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
import { openPicker } from './store/app';
import { selectEquipment } from './store/selectors';

/** What each slot type holds, for screen-reader labels ("Choose talisman"). */
const SLOT_LABELS: Record<SlotType, string> = {
  SLOT_TYPE_ARROW: 'arrow or bolt',
  SLOT_TYPE_CHEST: 'chest armor',
  SLOT_TYPE_CON: 'item',
  SLOT_TYPE_GAUNTLET: 'gauntlets',
  SLOT_TYPE_HELM: 'helm',
  SLOT_TYPE_LEG: 'leg armor',
  SLOT_TYPE_SPELL: 'spell',
  SLOT_TYPE_TAL: 'talisman',
  SLOT_TYPE_TEAR: 'crystal tear',
  SLOT_TYPE_WEAPON: 'weapon',
};

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
  size?: string | null;
  /** Editor weapon-skill slot this weapon slot reads and the picker edits. */
  subId?: WeaponSkillSlot | '';
  /** Skill name to show (display-only slots). Wins over `subId`. */
  subItem?: string | null;
  type: SlotType;
}

/**
 * One equipment/spell slot. Enabled: click (or Enter/Space) opens the item picker for `id`, to
 * choose, change or remove the item (and a weapon's affinity and skill). Shows hover badges for
 * affinity and skill.
 */
function Slot({
  affinity = '',
  affinityId = '',
  background = '',
  disabled = false,
  id = '',
  item = null,
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
    if (disabled) return;
    dispatch(
      openPicker({
        slotType: type,
        editSlot: id || null,
        editAffinitySlot: affinityId || null,
        editSubSlot: subId || null,
      }),
    );
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  // Enabled slots act as buttons that open the picker.
  const buttonProps = disabled
    ? {}
    : {
        role: 'button',
        tabIndex: 0,
        'aria-label': hasItem ? `Change ${item.name}` : `Choose ${SLOT_LABELS[type]}`,
        onKeyDown: handleKeyDown,
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
      onClick={handleClick}
      {...buttonProps}>
      {!hasItem ? null : <img alt="" src={`/assets/${item.imageUrl}`} />}
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

  &:focus-visible {
    outline: 2px solid ${COLOR_LIGHT_GOLD};
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

  /* Phone-sized slots are too small for the name: keep it for screen readers only. */
  @media ${BELOW_500} {
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    white-space: nowrap;
    width: 1px;
  }
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
