// Words for "How to get this build" (T15): what each route action says, and the item names and icons
// behind the route's `{ file, id }` refs.
import { keyItemName } from '@/data/acquisition';
import {
  getArmorById,
  getArrow,
  getAsh,
  getConsumable,
  getGreatRune,
  getSpell,
  getSpiritAsh,
  getTalisman,
  getTear,
  getWeapon,
} from '@/data';
import type { ItemRef, RouteAction, RouteItem, RouteLeg } from './route';

const getters = {
  weapons: getWeapon,
  arrows: getArrow,
  armor: getArmorById,
  talismans: getTalisman,
  ashesOfWar: getAsh,
  spells: getSpell,
  tears: getTear,
  consumables: getConsumable,
  greatRunes: getGreatRune,
  spiritAshes: getSpiritAsh,
} as const;

/** An item's name and icon; key items (whetblades, cookbooks, remembrances…) have no icon. */
export function itemInfo(ref: ItemRef): { name: string; icon: number | null } {
  if (ref.file === 'keyItems') return { name: keyItemName(ref.id) ?? 'Unknown item', icon: null };
  const item = getters[ref.file](ref.id);
  return item ? { name: item.name, icon: item.icon } : { name: 'Unknown item', icon: null };
}

/** What to do, before the items: "Defeat Godrick", "Buy from Twin Maiden Husks", "Pick up". */
export function actionLead({ kind, detail }: RouteAction): string {
  switch (kind) {
    case 'pickup':
      return 'Pick up';
    case 'restore':
      return 'Restore';
    case 'boss':
      return detail ? `Defeat ${detail}` : 'Defeat the boss';
    case 'enemy':
      return detail ? `Farm ${detail}` : 'Farm enemies';
    case 'shop':
      return detail ? `Buy from ${detail}` : 'Buy';
    case 'remembrance':
      return detail ? `Trade with ${detail}` : 'Trade';
    case 'quest':
      return detail || 'Quest reward';
    case 'start':
      return `Start as ${detail}`;
    case 'alteration':
      return detail || 'Alter at a Site of Grace';
    case 'craft':
      return detail && detail !== 'Known from the start'
        ? `Craft with ${detail}`
        : 'Craft (recipe known from the start)';
    case 'gate':
      return detail;
    case 'unknown':
      return 'No known source yet';
  }
}

/** A note after the whole action: where a pickup is ("Teardrop Scarab", a painting's reward). */
export const actionNote = ({ kind, detail }: RouteAction): string =>
  kind === 'pickup' ? detail : '';

const number = new Intl.NumberFormat('en');

/** Notes after one item: its price, what it's traded or altered from, the classes that start with it. */
export function itemNotes(action: RouteAction, item: RouteItem): string[] {
  const notes: string[] = [];
  if (item.cost) {
    const { amount, currency } = item.cost;
    const unit = currency === 'runes' ? 'runes' : amount === 1 ? 'Dragon Heart' : 'Dragon Hearts';
    notes.push(`${number.format(amount)} ${unit}`);
  }
  if (item.needs && action.kind === 'remembrance') notes.push(`for ${itemInfo(item.needs).name}`);
  if (item.needs && action.kind === 'alteration') notes.push(`from ${itemInfo(item.needs).name}`);
  if (item.startAlso?.length) notes.push(`or start as ${joinOr(item.startAlso)}`);
  return notes;
}

/** A leg's heading: the region, or the two legs that have none. */
export function legTitle(leg: RouteLeg): string {
  if (leg.kind === 'start') return 'At the start';
  if (leg.kind === 'elsewhere') return 'No fixed place';
  return leg.region?.name ?? 'Somewhere';
}

/** A step's place: its Site of Grace, or "Somewhere in Caelid" when only the region is known. */
export function stepPlace(leg: RouteLeg, location: { name: string } | null): string | null {
  if (location) return location.name;
  return leg.kind === 'region' && leg.region ? `Somewhere in ${leg.region.name}` : null;
}

function joinOr(words: string[]): string {
  const unique = [...new Set(words)];
  return unique.length < 2
    ? (unique[0] ?? '')
    : `${unique.slice(0, -1).join(', ')} or ${unique.at(-1) ?? ''}`;
}
