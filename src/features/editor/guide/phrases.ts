// Words for "How to get this build" (T15): what each route action says, why an item is on the route
// (T35), and the item names and icons behind the route's `{ file, id }` refs.
import { keyItem } from '@/data/acquisition';
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
import type { ItemRef, ItemUse, RouteAction, RouteItem, RouteLeg, RouteStep } from './route';

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

/** An item's name and icon (null when it has none). */
export function itemInfo(ref: ItemRef): { name: string; icon: number | null } {
  const item = ref.file === 'keyItems' ? keyItem(ref.id) : getters[ref.file](ref.id);
  return item ? { name: item.name, icon: item.icon || null } : { name: 'Unknown item', icon: null };
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

/**
 * Why an item is on the route (T35): the gate it meets ("Lets you put Ashes of War on weapons"), or
 * what it unlocks here ("Teaches the recipe for Bloodboil Aromatic"); '' for the build's own gear.
 */
export function itemReason(item: RouteItem): string {
  if (item.gate?.reason) return item.gate.reason;
  return (item.usedFor ?? []).map(useReason).join('; ');
}

function useReason({ kind, detail, items }: ItemUse): string {
  const names = listNames(items.map((ref) => itemInfo(ref).name));
  const who = detail.replace(/\s*\(.*\)$/, '');
  switch (kind) {
    case 'remembrance':
      return who ? `Trade it to ${who} for ${names}` : `Trade it for ${names}`;
    case 'shop':
      return who ? `Unlocks ${names} at ${who}` : `Unlocks ${names} in a shop`;
    case 'craft':
      return `Teaches the recipe for ${names}`;
    case 'restore':
      return 'Restore it at its Divine Tower';
    case 'alteration':
      return `Alter it into ${names}`;
    default:
      return `Needed for ${names}`;
  }
}

/** "A", "A and B", "A, B and C", "A, B and 3 more". */
function listNames(names: string[]): string {
  const unique = [...new Set(names)];
  if (unique.length > 3) return `${unique.slice(0, 2).join(', ')} and ${unique.length - 2} more`;
  return unique.length < 2
    ? (unique[0] ?? '')
    : `${unique.slice(0, -1).join(', ')} and ${unique.at(-1) ?? ''}`;
}

/** A leg's heading: the region, or the two legs that have none. */
export function legTitle(leg: RouteLeg): string {
  if (leg.kind === 'start') return 'At the start';
  if (leg.kind === 'elsewhere') return 'No fixed place';
  return leg.region?.name ?? 'Somewhere';
}

const NAMED_BY: RouteAction['kind'][] = ['boss', 'shop', 'enemy', 'remembrance', 'pickup'];

/**
 * A stop's title: its Site of Grace; where only the region is known, who or what it's about
 * ("Erdtree Avatar", "Pidia, Carian Servant", "Teardrop Scarab"), else "Somewhere in Caelid". Null
 * for the start and the no-fixed-place legs (their area label says it).
 */
export function stopTitle(leg: RouteLeg, step: RouteStep): string | null {
  if (step.location) return step.location.name;
  if (leg.kind !== 'region' || !leg.region) return null;
  const named = step.actions.find(
    (action) => NAMED_BY.includes(action.kind) && action.detail && action.detail.length <= 60,
  );
  return named ? named.detail : `Somewhere in ${leg.region.name}`;
}

/** What to do at a stop, in one line (the Next stop card): "Defeat Margit, the Fell Omen · Pick up". */
export const stopHow = (step: RouteStep): string => step.actions.map(actionLead).join(' · ');

function joinOr(words: string[]): string {
  const unique = [...new Set(words)];
  return unique.length < 2
    ? (unique[0] ?? '')
    : `${unique.slice(0, -1).join(', ')} or ${unique.at(-1) ?? ''}`;
}
