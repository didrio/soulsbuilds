import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ItemTile from '@/components/ui/ItemTile';
import { getCardItem, getCardWeapon, iconUrl } from '@/data/core';
import { hasImageItem, imageChoices, mainWeaponId } from '@/lib/equipment';
import type { BuildImage, Equipment, ImageKind } from '@/lib/models';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_GLOW,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  TEXT_MD,
  TEXT_SM,
} from '@/theme';

/** What each kind of build image is, under its name ("Talisman"). */
export const IMAGE_KIND_LABELS: Record<ImageKind, string> = {
  weapon: 'Weapon',
  helm: 'Helm',
  chest: 'Chest armor',
  gauntlet: 'Gauntlets',
  leg: 'Leg armor',
  talisman: 'Talisman',
  spell: 'Spell',
  tear: 'Crystal tear',
  greatRune: 'Great rune',
  spiritAsh: 'Spirit ash',
};

const DEFAULT = 'default';
const imageKey = (image: BuildImage) => `${image.kind}:${image.id}`;

interface BuildImageDialogProps {
  /** The author's pick so far (the draft), or null for the default. */
  image: BuildImage | null;
  equipment: Equipment;
  onChoose: (image: BuildImage | null) => void;
  onClose: () => void;
}

/**
 * Choosing the build image (T40): the default (the main weapon) or any of the build's gear, as radio
 * rows with the item's tile and name. "Use image" sets the draft; the build saves it with the rest.
 */
function BuildImageDialog({ image, equipment, onChoose, onClose }: BuildImageDialogProps) {
  const choices = imageChoices(equipment);
  const current = image && hasImageItem(equipment, image) ? image : null;
  const [selected, setSelected] = useState(current ? imageKey(current) : DEFAULT);
  const mainWeapon = getCardWeapon(mainWeaponId(equipment));
  const list = useRef<HTMLUListElement>(null);

  // Opening on a pick far down the list (spells come last): show it.
  useEffect(() => {
    list.current?.querySelector(':checked')?.scrollIntoView?.({ block: 'center' });
  }, []);

  const handleUse = () => {
    onChoose(choices.find((choice) => imageKey(choice) === selected) ?? null);
    onClose();
  };

  return (
    <Dialog title="Build image" onClose={onClose} width={480}>
      <Intro>The item that pictures your build on its page and in the lists of builds.</Intro>
      <Options ref={list}>
        <Option
          value={DEFAULT}
          selected={selected}
          onSelect={setSelected}
          icon={mainWeapon?.icon ?? null}
          name="Default"
          detail={mainWeapon ? `Main weapon: ${mainWeapon.name}` : 'Main weapon (none yet)'}
        />
        {choices.map((choice) => {
          const item = getCardItem(choice);
          if (!item) return null;
          return (
            <Option
              key={imageKey(choice)}
              value={imageKey(choice)}
              selected={selected}
              onSelect={setSelected}
              icon={item.icon}
              name={item.name}
              detail={IMAGE_KIND_LABELS[choice.kind]}
            />
          );
        })}
      </Options>
      <Actions>
        <Button onClick={handleUse}>Use image</Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </Actions>
    </Dialog>
  );
}

interface OptionProps {
  value: string;
  selected: string;
  onSelect: (value: string) => void;
  icon: number | null;
  name: string;
  detail: string;
}

function Option({ value, selected, onSelect, icon, name, detail }: OptionProps) {
  return (
    <li>
      <OptionLabel>
        <input
          type="radio"
          name="build-image"
          value={value}
          checked={selected === value}
          onChange={() => onSelect(value)}
        />
        <ItemTile src={icon === null ? null : iconUrl(icon)} size={44} />
        <Text>
          <Name>{name}</Name>
          <Detail>{detail}</Detail>
        </Text>
      </OptionLabel>
    </li>
  );
}

const Intro = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0 0 ${SPACE_MD};
`;

const Options = styled.ul`
  display: grid;
  gap: 2px;
  list-style: none;
  margin: 0;
  max-height: min(60vh, 520px);
  overflow-y: auto;
  padding: 0;
`;

const OptionLabel = styled.label`
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  gap: ${SPACE_SM};
  min-height: 52px;
  padding: 4px ${SPACE_SM};

  input {
    accent-color: ${COLOR_ACCENT};
    flex: none;
    height: 18px;
    margin: 0;
    width: 18px;
  }

  &:hover,
  &:has(input:focus-visible),
  &:has(input:checked) {
    background: linear-gradient(
      90deg,
      transparent,
      ${COLOR_GLOW} 20%,
      ${COLOR_GLOW} 80%,
      transparent
    );
  }
`;

const Text = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Name = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_MD};
  font-weight: 600;
  line-height: 1.3;
`;

const Detail = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
`;

const Actions = styled.div`
  border-top: 1px solid ${COLOR_LINE};
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  margin-top: ${SPACE_LG};
  padding-top: ${SPACE_MD};

  @media ${BELOW_MOBILE} {
    flex-direction: column;
  }
`;

export default BuildImageDialog;
