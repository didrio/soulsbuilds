import { describe, expect, it } from 'vitest';
import { getAsh, getSpell, getWeapon, spells } from '@/data';
import { MOONVEIL, SEPPUKU_ASH, UCHIGATANA } from '@/test/fixtures';
import { itemSubline, weaponDetailLabels, weaponDetails } from './itemDetails';

const BRASS_SHIELD = 31130000;
const uchigatana = getWeapon(UCHIGATANA)!;

describe('weaponDetails', () => {
  it.each([
    ['an Ash and an affinity', uchigatana, SEPPUKU_ASH, 'blood', 'Blood · Seppuku'],
    ['the built-in skill', uchigatana, null, null, 'Unsheathe'],
    ['Standard as no affinity', uchigatana, null, 'standard', 'Unsheathe'],
    ['a unique skill', getWeapon(MOONVEIL)!, null, null, 'Transient Moonlight'],
    ['nothing for "No Skill"', getWeapon(BRASS_SHIELD)!, null, null, ''],
  ] as const)('shows %s', (_case, weapon, ashId, affinity, subline) => {
    const details = weaponDetails(weapon, ashId ? getAsh(ashId)! : null, affinity);
    expect(itemSubline(weapon, details)).toBe(subline);
  });

  it('names the parts for screen readers', () => {
    const details = weaponDetails(uchigatana, getAsh(SEPPUKU_ASH)!, 'blood');
    expect(weaponDetailLabels(details)).toEqual(['Blood affinity', 'Seppuku skill']);
    expect(details.fromAsh).toBe(true);
  });
});

describe('itemSubline', () => {
  it("shows a spell's memory slots", () => {
    const oneSlot = spells.find(({ slots }) => slots === 1)!;
    const twoSlots = spells.find(({ slots }) => slots === 2)!;
    expect(itemSubline(getSpell(oneSlot.id)!, null)).toBe('1 slot');
    expect(itemSubline(twoSlots, null)).toBe('2 slots');
  });
});
