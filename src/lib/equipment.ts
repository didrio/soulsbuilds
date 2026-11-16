// Facts about a build's equipment that pages show (framework-free).
import type { BuildContent, BuildImage, Equipment } from './models';

/**
 * The build's signature weapon, by game ID (T28 hero, T29 landing rows): the first filled main-hand
 * slot (weapons 1–3), else the first filled weapon at all, else null.
 */
export function mainWeaponId(equipment: Pick<Equipment, 'weapons'>): number | null {
  const filled = (id: number | null): id is number => id !== null;
  return equipment.weapons.slice(0, 3).find(filled) ?? equipment.weapons.find(filled) ?? null;
}

/** Whether the build carries `image`'s item, in a slot of its kind. */
export function hasImageItem(equipment: Equipment, { kind, id }: BuildImage): boolean {
  switch (kind) {
    case 'weapon':
      return equipment.weapons.includes(id);
    case 'talisman':
      return equipment.talismans.includes(id);
    case 'spell':
      return equipment.spells.includes(id);
    case 'tear':
      return equipment.tears.includes(id);
    default:
      return equipment[kind] === id;
  }
}

/**
 * The item that pictures the build (T40; the hero, the landing rows, the profile panels): the author's
 * pick while it's still on the build, else the main weapon, else null. A pick that left the build
 * (removed or swapped) is ignored here, at read time; nothing is rewritten.
 */
export function buildImage(build: Pick<BuildContent, 'image' | 'equipment'>): BuildImage | null {
  const { image, equipment } = build;
  if (image && hasImageItem(equipment, image)) return image;
  const weapon = mainWeaponId(equipment);
  return weapon === null ? null : { kind: 'weapon', id: weapon };
}

/**
 * The build's items the author can pick as its image (T40), in Loadout order without duplicates:
 * weapons, armor, talismans, tears, great rune, spirit ash, spells. Never arrows or consumables.
 */
export function imageChoices(equipment: Equipment): BuildImage[] {
  const all: BuildImage[] = [
    ...equipment.weapons.filter((id) => id !== null).map((id) => ({ kind: 'weapon', id }) as const),
    ...(['helm', 'chest', 'gauntlet', 'leg'] as const).flatMap((kind) =>
      equipment[kind] === null ? [] : [{ kind, id: equipment[kind] }],
    ),
    ...equipment.talismans.map((id) => ({ kind: 'talisman', id }) as const),
    ...equipment.tears.map((id) => ({ kind: 'tear', id }) as const),
    ...(['greatRune', 'spiritAsh'] as const).flatMap((kind) =>
      equipment[kind] === null ? [] : [{ kind, id: equipment[kind] }],
    ),
    ...equipment.spells.map((id) => ({ kind: 'spell', id }) as const),
  ];
  return all.filter((image, index) => all.findIndex((other) => sameImage(other, image)) === index);
}

/** Whether two images are the same item. */
export const sameImage = (a: BuildImage | null, b: BuildImage | null) =>
  a === b || (a !== null && b !== null && a.kind === b.kind && a.id === b.id);
