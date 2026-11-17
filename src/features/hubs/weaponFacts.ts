// A weapon's facts as its page shows them (T55): the item card's (T45) for the weapon as it comes, no
// affinity or Ash of War, and nobody's stats to check against. Shared with the link-preview function.
import type { Weapon } from '@/data';
import { itemFacts, type ItemFacts } from '@/features/editor/itemFacts';
import { SLOT_TYPE_WEAPON } from '@/features/editor/slots';

export function weaponFacts(weapon: Weapon): ItemFacts {
  return (
    itemFacts({ id: 'weapon1', type: SLOT_TYPE_WEAPON, item: weapon }) ?? {
      kind: 'Weapon',
      subline: '',
      rows: [],
      effect: '',
    }
  );
}

/** One line for search results: "Katana. Requires: Str 12, Dex 18, Int 23." */
export function weaponDetail(weapon: Weapon): string {
  const facts = weaponFacts(weapon);
  const requires = facts.rows.find((row) => row.label === 'Requires');
  const needs = requires ? ` Requires: ${requires.parts.map((part) => part.text).join(', ')}.` : '';
  return `${facts.kind}.${needs}`;
}
