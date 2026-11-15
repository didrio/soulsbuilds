import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  affinityName,
  getAsh,
  iconUrl,
  NO_SKILL_ID,
  weaponSkill,
  type AffinityKey,
  type AshOfWar,
  type SlotItem,
  type Weapon,
} from '@/data';
import {
  COLOR_LIGHT_GOLD,
  COLOR_DARK_GOLD,
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_DARK_GREEN,
  COLOR_TEXT_SHADOW,
  COLOR_WHITE,
  BELOW_400,
  BELOW_500,
  BELOW_800,
  BELOW_1400,
  SPACE_GUTTER,
  COLOR_LIGHTEST_GREEN,
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
  SLOT_TYPE_GREAT_RUNE: 'great rune',
  SLOT_TYPE_HELM: 'helm',
  SLOT_TYPE_LEG: 'leg armor',
  SLOT_TYPE_SPELL: 'spell',
  SLOT_TYPE_SPIRIT_ASH: 'spirit ash',
  SLOT_TYPE_TAL: 'talisman',
  SLOT_TYPE_TEAR: 'crystal tear',
  SLOT_TYPE_WEAPON: 'weapon',
};

const SLOT_SIZE = '80px';
const SLOT_SIZE_SMALL = '60px';
const SLOT_SIZE_XSMALL = '50px';
const SLOT_SIZE_XXSMALL = '40px';

interface SlotProps {
  /** Affinity to show (display-only slots; null = Standard). Wins over `affinityId`. */
  affinity?: AffinityKey | null;
  /** Editor affinity slot this weapon slot reads and the picker edits. */
  affinityId?: WeaponAffinitySlot | '';
  /** Ash of War ID to show (display-only slots; null = built-in skill). Wins over `subId`. */
  ash?: number | null;
  /** Empty-slot placeholder: public/assets/menu/<background>.png. */
  background?: string;
  /** Empty-slot placeholder from the game's icons instead (faded): an item's `icon`. */
  backgroundIcon?: number;
  disabled?: boolean;
  /** Editor slot the picker writes to. */
  id?: ItemSlot | '';
  item?: SlotItem | null;
  size?: string | null;
  /** Editor Ash of War slot this weapon slot reads and the picker edits. */
  subId?: WeaponSkillSlot | '';
  type: SlotType;
}

const isWeapon = (item: SlotItem | null): item is Weapon => item !== null && 'ashesOfWar' in item;

type Tip = 'affinity' | 'skill';

/**
 * One equipment/spell slot. Enabled: click (or Enter/Space) opens the item picker for `id`, to
 * choose, change or remove the item (and a weapon's affinity and skill). "A"/"S" badges show the
 * weapon's affinity and skill: on mouse hover, and in view mode (disabled slots) also as buttons
 * that toggle the details on tap or keyboard. In edit mode the picker shows them instead.
 */
function Slot({
  affinity = null,
  affinityId = '',
  ash = null,
  background = '',
  backgroundIcon,
  disabled = false,
  id = '',
  item = null,
  size = null,
  subId = '',
  type,
}: SlotProps) {
  const dispatch = useAppDispatch();
  const equipment = useAppSelector(selectEquipment);

  const [openTip, setOpenTip] = useState<Tip | null>(null);
  // Opened by a click/tap/key (stays open) rather than by hover (closes on leave).
  const [pinned, setPinned] = useState(false);

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

  // A weapon's affinity (null = Standard: no badge) and skill (its Ash's, else its built-in one;
  // "No Skill" gets no badge).
  const weapon = isWeapon(item) ? item : null;
  const appliedAsh: AshOfWar | null =
    (ash !== null ? getAsh(ash) : subId ? equipment[subId] : null) ?? null;
  const affinityKey = affinity ?? (affinityId ? equipment[affinityId] : null);
  const weaponAffinity = weapon && affinityKey ? affinityName(affinityKey) : null;
  const skill = weapon ? weaponSkill(weapon, appliedAsh) : undefined;
  const weaponSkillShown = skill && skill.id !== NO_SKILL_ID ? skill : undefined;
  const details = [
    weaponAffinity ? `${weaponAffinity} affinity` : null,
    weaponSkillShown ? `${weaponSkillShown.name} skill` : null,
  ].filter(Boolean);

  // Enabled slots act as buttons that open the picker.
  const buttonProps = disabled
    ? {}
    : {
        role: 'button',
        tabIndex: 0,
        'aria-label': hasItem
          ? `Change ${item.name}${details.length ? ` (${details.join(', ')})` : ''}`
          : `Choose ${SLOT_LABELS[type]}`,
        onKeyDown: handleKeyDown,
      };

  // Hover opens a tip for mouse users only (a tap also fires pointer events, then its click pins it).
  const badgeProps = (tip: Tip, label: string) => {
    const hover = {
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType === 'mouse' && !pinned) setOpenTip(tip);
      },
      onPointerLeave: (event: PointerEvent) => {
        if (event.pointerType === 'mouse' && !pinned) setOpenTip(null);
      },
    };
    if (!disabled) return { ...hover, 'aria-hidden': true };
    const close = () => {
      setPinned(false);
      setOpenTip(null);
    };
    return {
      ...hover,
      as: 'button' as const,
      type: 'button' as const,
      'aria-label': label,
      'aria-expanded': openTip === tip,
      onClick: () => {
        if (pinned && openTip === tip) return close();
        setPinned(true);
        setOpenTip(tip);
      },
      onBlur: close,
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'Escape') close();
      },
    };
  };

  return (
    <Container
      $background={backgroundIcon ? iconUrl(backgroundIcon) : `/assets/menu/${background}.png`}
      $faded={backgroundIcon !== undefined}
      $backgroundColor={backgroundColor}
      $disabled={disabled}
      $hasItem={hasItem}
      $hoverColor={hoverColor}
      $size={size}
      onClick={handleClick}
      {...buttonProps}>
      {!hasItem ? null : <img alt="" loading="lazy" decoding="async" src={iconUrl(item.icon)} />}
      {!hasItem ? null : <NameContainer>{item.name}</NameContainer>}
      {weaponAffinity ? (
        <WeaponAffinityIconContainer {...badgeProps('affinity', `Affinity: ${weaponAffinity}`)}>
          A
        </WeaponAffinityIconContainer>
      ) : null}
      {weaponSkillShown ? (
        <WeaponSkillIconContainer {...badgeProps('skill', `Skill: ${weaponSkillShown.name}`)}>
          S
        </WeaponSkillIconContainer>
      ) : null}
      {weaponSkillShown && openTip === 'skill' ? (
        <WeaponSkillContainer vertical role="tooltip">
          <FlexGroup>
            <WeaponSkillLabel>Weapon Skill:</WeaponSkillLabel>
            <WeaponSkillValue>{weaponSkillShown.name}</WeaponSkillValue>
          </FlexGroup>
          <FlexGroup>
            <WeaponSkillLabel>From:</WeaponSkillLabel>
            <WeaponSkillValue>{appliedAsh ? 'Ash of War' : 'Built-in'}</WeaponSkillValue>
          </FlexGroup>
          <FlexGroup>
            <WeaponSkillLabel>FP:</WeaponSkillLabel>
            <WeaponSkillValue>{weaponSkillShown.fp}</WeaponSkillValue>
          </FlexGroup>
        </WeaponSkillContainer>
      ) : null}
      {weaponAffinity && openTip === 'affinity' ? (
        <WeaponSkillContainer vertical role="tooltip">
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
  /** Placeholder image URL for an empty slot. */
  $background: string;
  $faded: boolean;
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
    background-image: ${({ $background, $hasItem }) => ($hasItem ? 'none' : `url("${$background}")`)};
    background-size: auto 80%;
    background-repeat: no-repeat;
    background-position: center;
    opacity: ${({ $faded }) => ($faded ? 0.3 : 1)};
    filter: ${({ $faded }) => ($faded ? 'grayscale(1)' : 'none')};
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
  color: ${COLOR_WHITE};
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

const WeaponSkillIconContainer = styled.span`
  display: flex;
  box-sizing: border-box;
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
  color: inherit;
  font: inherit;
  font-size: 12px;
  padding: 0;
  z-index: 2;
  cursor: ${({ as }) => (as === 'button' ? 'pointer' : 'default')};

  &:hover,
  &[aria-expanded='true'] {
    background-color: ${COLOR_LIGHT_GREEN};
    color: ${COLOR_LIGHTEST_GREEN};
  }

  &:focus-visible {
    outline: 2px solid ${COLOR_LIGHT_GOLD};
  }

  /* A bigger tap target on phones, without growing the badge. */
  @media ${BELOW_800} {
    &::after {
      content: '';
      inset: -8px;
      position: absolute;
    }
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

  /* On phones the side placement runs off-screen: pin the details to the bottom of the viewport. */
  @media ${BELOW_800} {
    position: fixed;
    top: auto;
    right: ${SPACE_GUTTER};
    bottom: ${SPACE_GUTTER};
    left: ${SPACE_GUTTER};
    width: auto;
    padding: 12px;
    z-index: 200;
  }
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
