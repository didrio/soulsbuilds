import { describe, expect, it } from 'vitest';
import { spells, weapons, weaponTypes, type SlotItem } from '@/data';
import { filterItems, NO_FILTERS, presentTypes, type PickerFilters } from './picker';

const names = (filters: Partial<PickerFilters>, items: readonly SlotItem[] = weapons) =>
  filterItems(items, { ...NO_FILTERS, ...filters }).map(({ name }) => name);

const KATANA = weaponTypes.find(({ name }) => name === 'Katana')!.id;

describe('filterItems', () => {
  it('sorts by name and searches case-insensitively', () => {
    const all = names({});
    expect(all).toHaveLength(weapons.length);
    expect(all.every((name, i) => i === 0 || all[i - 1]! <= name)).toBe(true);
    expect(names({ search: '  UCHIGATANA ' })).toEqual(['Uchigatana']);
  });

  it.each([
    [{ weaponType: KATANA }, 'Uchigatana', 'Claymore'],
    [{ dlc: 'base' as const }, 'Moonveil', 'Star-Lined Sword'],
    [{ dlc: 'dlc' as const }, 'Star-Lined Sword', 'Moonveil'],
  ])('%o keeps %s, drops %s', (filters, kept, dropped) => {
    expect(names(filters)).toContain(kept);
    expect(names(filters)).not.toContain(dropped);
  });

  it('combines filters', () => {
    const baseKatanas = names({ weaponType: KATANA, dlc: 'base' });
    expect(baseKatanas).toContain('Rivers of Blood');
    expect(baseKatanas).not.toContain('Star-Lined Sword');
    expect(names({ weaponType: KATANA, search: 'moon' })).toEqual(['Moonveil']);
  });

  it('filters spells by kind', () => {
    const sorceries = names({ spellKind: 'sorcery' }, spells);
    expect(sorceries).toContain('Comet Azur');
    expect(sorceries).not.toContain('Golden Vow');
    expect(names({ spellKind: 'incantation' }, spells)).toContain('Golden Vow');
  });
});

describe('presentTypes', () => {
  it('lists only the types some weapon has, in the given order', () => {
    const types = presentTypes(weaponTypes, weapons);
    expect(types.length).toBeGreaterThan(20);
    expect(types[0]!.name).toBe('Dagger');
    expect(types.every((type) => weapons.some((weapon) => weapon.type === type.id))).toBe(true);
  });
});
