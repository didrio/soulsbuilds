import styled from 'styled-components';
import DropDown from '@/components/ui/DropDown';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  affinities,
  affinityName,
  allowedAffinities,
  ashChoices,
  ashLabel,
  getAsh,
  weaponSkill,
  type Weapon,
} from '@/data';
import { sortBy } from '@/lib/array';
import { BELOW_MOBILE, SPACE_MD, SPACE_XS, TEXT_MD } from '@/theme';
import { updateWeaponAffinity, updateWeaponSkill } from './store/equipment';
import {
  selectEditAffinitySlot,
  selectEditedItem,
  selectEditSubSlot,
  selectEditWeaponAffinity,
  selectEditWeaponSkill,
} from './store/selectors';
import { labelText } from '@/components/ui/typography';

/**
 * The picker's Ash of War and affinity controls for the weapon slot being edited. Only what the game
 * allows: the Ashes that fit the weapon, and the affinities the weapon and that Ash share. Weapons
 * that can't take an Ash show their fixed skill.
 */
function WeaponOptions() {
  const dispatch = useAppDispatch();
  const editAffinitySlot = useAppSelector(selectEditAffinitySlot);
  const editSubSlot = useAppSelector(selectEditSubSlot);
  const ash = useAppSelector(selectEditWeaponSkill);
  const affinity = useAppSelector(selectEditWeaponAffinity);
  // The picker is open for a weapon slot, so the item in it is a weapon (or nothing).
  const weapon = useAppSelector(selectEditedItem) as Weapon | null;

  if (!weapon) return null;

  const builtIn = weaponSkill(weapon, null)?.name ?? 'None';
  const choices = sortBy(
    ashChoices(weapon).map((choice) => ({ value: String(choice.id), label: ashLabel(choice) })),
    ({ label }) => label,
  );
  const affinityOptions = allowedAffinities(weapon, ash)
    .filter((key) => key !== 'standard')
    .map((key) => ({ value: key, label: affinityName(key) }));

  const handleAshChange = (value: string | null) => {
    const choice = value === null ? undefined : getAsh(Number(value));
    if (editSubSlot) dispatch(updateWeaponSkill({ id: editSubSlot, item: choice ?? null }));
  };

  const handleAffinityChange = (value: string | null) => {
    const key = affinities.find((option) => option.key === value)?.key ?? null;
    if (editAffinitySlot) dispatch(updateWeaponAffinity({ id: editAffinitySlot, item: key }));
  };

  if (!choices.length) {
    return (
      <Field>
        <Label>Skill</Label>
        <Fixed>{builtIn} (can't be changed)</Fixed>
      </Field>
    );
  }

  return (
    <Fields>
      <Field>
        <Label>Ash of War</Label>
        <DropDown
          label="Ash of War"
          onChange={handleAshChange}
          options={choices}
          placeholder={`Built-in: ${builtIn}`}
          value={ash ? String(ash.id) : ''}
        />
      </Field>
      {affinityOptions.length ? (
        <Field>
          <Label>Affinity</Label>
          <DropDown
            label="Affinity"
            onChange={handleAffinityChange}
            options={affinityOptions}
            placeholder="Standard"
            value={affinity ?? ''}
          />
        </Field>
      ) : null}
    </Fields>
  );
}

const Fields = styled.div`
  display: grid;
  gap: ${SPACE_MD};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media ${BELOW_MOBILE} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Field = styled.div`
  display: grid;
  gap: ${SPACE_XS};
`;

// The selects are named by their aria-label; this is the visible caption.
const Label = styled.span`
  ${labelText}
`;

const Fixed = styled.span`
  font-size: ${TEXT_MD};
`;

export default WeaponOptions;
