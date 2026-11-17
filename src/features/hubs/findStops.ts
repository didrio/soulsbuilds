// "Where to find it" on a weapon page (T55): the Guide's route (T14/T15) for that one weapon, so the
// page says what the build page's Guide would: the stops in route order, the gates it needs first
// included (a whetblade, a boss that opens the way). Pure; the acquisition data is passed in (it's
// ~400 KB, loaded lazily by the page).
import type { Acquisition } from '@/data/schema';
import type { Equipment } from '@/lib/models';
import { actionLead, itemInfo, legTitle, stopTitle } from '@/features/editor/guide/phrases';
import { planRoute, type RouteAction } from '@/features/editor/guide/route';

export interface FindStop {
  /** The region, "At the start" or "No fixed place". */
  area: string;
  /** The Site of Grace, or who or what the stop is about; null when the area says it all. */
  place: string | null;
  /** What to do there: "Defeat Magma Wyrm", "Pick up Academy Glintstone Key". */
  how: string;
  /** Whether this stop gives the weapon itself (the others are what it takes to get there). */
  gives: boolean;
}

const onlyWeapon = (id: number): Equipment => ({
  weapons: [id, null, null, null, null, null],
  weaponAffinities: [null, null, null, null, null, null],
  weaponSkills: [null, null, null, null, null, null],
  arrows: [null, null, null, null],
  talismans: [],
  spells: [],
  tears: [],
  consumables: [],
  helm: null,
  chest: null,
  gauntlet: null,
  leg: null,
  greatRune: null,
  spiritAsh: null,
});

/** An action in one line; a pickup names what lies there ("Pick up" alone says nothing on this page). */
const how = (action: RouteAction) =>
  action.kind === 'pickup' && action.items.length
    ? `Pick up ${action.items.map((item) => itemInfo(item.ref).name).join(', ')}`
    : actionLead(action);

/** The stops to get weapon `id`, in route order; [] when the data doesn't know where it comes from. */
export function whereToFind(id: number, data: Acquisition): FindStop[] {
  return planRoute(onlyWeapon(id), data).legs.flatMap((leg) =>
    leg.steps
      .map((step) => ({ ...step, actions: step.actions.filter((a) => a.kind !== 'unknown') }))
      .filter((step) => step.actions.length > 0)
      .map((step) => ({
        area: legTitle(leg),
        place: stopTitle(leg, step),
        how: step.actions.map(how).join(' · '),
        gives: step.actions.some((action) =>
          action.items.some((item) => item.ref.file === 'weapons' && item.ref.id === id),
        ),
      })),
  );
}
