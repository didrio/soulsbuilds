import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
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
import { BELOW_750 } from '@/theme';
import { updateWeaponAffinity, updateWeaponSkill } from './store/equipment';
import {
  selectEditAffinitySlot,
  selectEditedItem,
  selectEditSubSlot,
  selectEditWeaponAffinity,
  selectEditWeaponSkill,
} from './store/selectors';

/**
 * The item picker's Ash of War and affinity controls for the weapon slot being edited. Only what the
 * game allows: the Ashes that fit the weapon, and the affinities the weapon and that Ash share.
 * Weapons that can't take an Ash show their fixed skill; an empty slot says to choose a weapon first.
 */
function WeaponOptions() {
  const dispatch = useAppDispatch();
  const editAffinitySlot = useAppSelector(selectEditAffinitySlot);
  const editSubSlot = useAppSelector(selectEditSubSlot);
  const ash = useAppSelector(selectEditWeaponSkill);
  const affinity = useAppSelector(selectEditWeaponAffinity);
  // The picker is open for a weapon slot, so the item in it is a weapon (or nothing).
  const weapon = useAppSelector(selectEditedItem) as Weapon | null;

  if (!weapon) {
    return <Hint>Choose a weapon, then open it again for its Ash of War and affinity.</Hint>;
  }

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
      <Container>
        <Label>Skill</Label>
        <Fixed>{builtIn} (can't be changed)</Fixed>
      </Container>
    );
  }

  return (
    <Container>
      <Label>Ash of War</Label>
      <Field>
        <DropDown
          label="Ash of War"
          onChange={handleAshChange}
          options={choices}
          placeholder={`Built-in: ${builtIn}`}
          value={ash ? String(ash.id) : ''}
        />
      </Field>
      {affinityOptions.length ? (
        <>
          <Label>Affinity</Label>
          <Field>
            <DropDown
              label="Affinity"
              onChange={handleAffinityChange}
              options={affinityOptions}
              placeholder="Standard"
              value={affinity ?? ''}
            />
          </Field>
        </>
      ) : null}
    </Container>
  );
}

const Container = styled(FlexGroup)`
  margin-bottom: 10px;
  margin-top: 10px;
  width: 100%;
  justify-content: center;
  align-items: center;

  @media ${BELOW_750} {
    flex-wrap: wrap;
    gap: 6px 0;
  }
`;

const Label = styled(FlexGroup)`
  font-size: 16px;
  font-weight: bold;
  margin-right: 20px;

  @media ${BELOW_750} {
    flex: 0 0 30%;
    margin-right: 0;
  }
`;

const Field = styled(FlexGroup)`
  margin-right: 20px;
  width: 220px;

  @media ${BELOW_750} {
    flex: 1 1 60%;
    margin-right: 0;
    width: auto;
  }
`;

const Fixed = styled.span`
  font-size: 16px;
`;

const Hint = styled.p`
  margin: 10px 0;
  text-align: center;
`;

export default WeaponOptions;
