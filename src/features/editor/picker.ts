// The item picker's list: which items match the search and filters, sorted by name. Pure, so the
// filters are tested without rendering the ~490-row weapon list.
import type { SlotItem } from '@/data';
import { sortBy } from '@/lib/array';

export type DlcFilter = 'all' | 'base' | 'dlc';
export type SpellKindFilter = 'all' | 'sorcery' | 'incantation';

export interface PickerFilters {
  search: string;
  /** Weapon type ID (weapon slots only); null for every type. */
  weaponType: number | null;
  spellKind: SpellKindFilter;
  dlc: DlcFilter;
}

export const NO_FILTERS: PickerFilters = {
  search: '',
  weaponType: null,
  spellKind: 'all',
  dlc: 'all',
};

/** The items that match every filter, by name. A filter that doesn't apply to an item ignores it. */
export function filterItems<T extends SlotItem>(items: readonly T[], filters: PickerFilters): T[] {
  const search = filters.search.trim().toLowerCase();
  const matches = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search)) return false;
    if (filters.dlc !== 'all' && item.dlc !== (filters.dlc === 'dlc')) return false;
    if (filters.weaponType !== null && 'type' in item && item.type !== filters.weaponType) {
      return false;
    }
    if (filters.spellKind !== 'all' && 'kind' in item && item.kind !== filters.spellKind) {
      return false;
    }
    return true;
  });
  return sortBy(matches, ({ name }) => name);
}

/** The weapon types the given weapons have, in the order of `types` (the game's). */
export function presentTypes<Type extends { id: number }>(
  types: readonly Type[],
  items: readonly { type: number }[],
): Type[] {
  const present = new Set(items.map((item) => item.type));
  return types.filter((type) => present.has(type.id));
}
