// Facts about a build's equipment that pages show (framework-free).
import type { Equipment } from './models';

/**
 * The build's signature weapon, by game ID (T28 hero, T29 landing rows): the first filled main-hand
 * slot (weapons 1–3), else the first filled weapon at all, else null.
 */
export function mainWeaponId(equipment: Pick<Equipment, 'weapons'>): number | null {
  const filled = (id: number | null): id is number => id !== null;
  return equipment.weapons.slice(0, 3).find(filled) ?? equipment.weapons.find(filled) ?? null;
}
