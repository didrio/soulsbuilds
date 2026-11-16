// "How to get this build" (T15): turns a build's equipment into a short route from a fresh save, using
// T14's acquisition data (docs/data.md "Acquisition"). Pure: the data is passed in, so tests can use a
// small fixture table.
//
// "Efficient" means a sensible earliest-first order through the usual progression, not a proven shortest
// path: every item takes the source that's reachable earliest (its grace's route order, pushed back by
// the gates it needs), the gates it implies join the route, and a topological sort with the route order
// as the tie-breaker puts it all in order. Consecutive things at one grace merge into one step, and
// consecutive steps in one region into one leg.
import type {
  Acquisition,
  AcquisitionFile,
  Gate,
  Location,
  Region,
  Source,
  SourceKind,
} from '@/data/schema';
import type { Equipment } from '@/lib/models';

export interface ItemRef {
  file: AcquisitionFile;
  id: number;
}

/** One item an action gets you, with what it costs or needs. */
export interface RouteItem {
  ref: ItemRef;
  cost?: Source['cost'];
  /** Needed first: the remembrance to trade, the cookbook, the armor to alter, the unrestored rune. */
  needs?: ItemRef;
  /** Starting classes that begin with it, when the route gets it elsewhere ("or start as …"). */
  startAlso?: string[];
  /** What it's needed for on this route (T35): the trade, purchase, recipe or restoring it unlocks. */
  usedFor?: ItemUse[];
  /** The gate it meets (T35): the Whetstone Knife, a whetblade, a medallion half; its `reason` says why. */
  gate?: Gate;
}

/** Things on the route that need an item first, by how they use it: "buy from Corhyn" → [two spells]. */
export interface ItemUse {
  kind: ActionKind;
  detail: string;
  items: ItemRef[];
}

/**
 * What to do at a step. `restore` is a Great Rune restored at its Divine Tower; `gate` a progression
 * step ("Defeat Margit, the Fell Omen", `detail` = its label, items = what that boss also drops);
 * `unknown` an item with no known source.
 */
export type ActionKind = SourceKind | 'restore' | 'gate' | 'unknown';

export interface RouteAction {
  kind: ActionKind;
  /** The boss, merchant, enemy, NPC, class, cookbook… ('' for a pickup), or a gate's label. */
  detail: string;
  items: RouteItem[];
  /** A gate's reason (T35): "Main-path boss: …". */
  reason?: string;
  /** A gate's id (T44: marking its stop done). */
  gate?: string;
}

export interface RouteStep {
  /** The Site of Grace; null when only the region is known, at the start, or with no fixed place. */
  location: Location | null;
  actions: RouteAction[];
}

export interface RouteLeg {
  /** `start`: choosing a starting class; `elsewhere`: items with no fixed place, last. */
  kind: 'start' | 'region' | 'elsewhere';
  region: Region | null;
  steps: RouteStep[];
}

export interface Route {
  legs: RouteLeg[];
}

// --- Places -----------------------------------------------------------------------------------------

/** Route position of a place: a grace's global order; a region alone sorts after its graces. */
interface Place {
  key: number;
  location: Location | null;
  region: Region | null;
  /** Merge key: graces by ID, region-only places by region, plus the two special legs. */
  id: string;
}

const START: Place = { key: 0, location: null, region: null, id: 'start' };
const ELSEWHERE: Place = { key: Infinity, location: null, region: null, id: 'elsewhere' };

// --- Nodes ------------------------------------------------------------------------------------------

type Key = string;
const itemKey = (ref: ItemRef): Key => `item:${ref.file}:${ref.id}`;
const gateKey = (id: string): Key => `gate:${id}`;

interface Option {
  source: Source;
  /** Its place; null = takes the place of its latest prerequisite (crafting, altering). */
  place: Place | null;
  prereqs: Key[];
}

interface ItemNode {
  type: 'item';
  key: Key;
  ref: ItemRef;
  options: Option[];
  /** Starting-class sources, used only when nothing else is reachable. */
  starts: Source[];
}

interface GateNode {
  type: 'gate';
  key: Key;
  gate: Gate;
  place: Place | null;
  prereqs: Key[];
}

type Node = ItemNode | GateNode;

/** Turns a build's equipment into a route. See the comment at the top of this file. */
export function planRoute(equipment: Equipment, data: Acquisition): Route {
  const locations = new Map(data.locations.map((location) => [location.id, location]));
  const regions = new Map(data.regions.map((region) => [region.id, region]));
  const gates = new Map(data.gates.map((gate) => [gate.id, gate]));
  const regionEnd = new Map<number, number>();
  for (const location of data.locations) {
    regionEnd.set(location.region, Math.max(regionEnd.get(location.region) ?? 0, location.order));
  }

  const placeOf = (source: { location: number | null; region: number | null }): Place | null => {
    const location = locations.get(source.location ?? NaN);
    if (location) {
      const region = regions.get(location.region) ?? null;
      return { key: location.order, location, region, id: `l${location.id}` };
    }
    const region = regions.get(source.region ?? NaN);
    if (region) {
      return {
        key: (regionEnd.get(region.id) ?? 0) + 0.5,
        location: null,
        region,
        id: `r${region.id}`,
      };
    }
    return null;
  };
  const placeRequires = (place: Place | null): string[] =>
    place?.location?.requires ?? place?.region?.requires ?? [];

  // 1. The graph: every node the build could need, with its options and prerequisites.
  const nodes = new Map<Key, Node>();
  const visit = (key: Key, make: () => Node) => {
    if (nodes.has(key)) return;
    const node = make();
    nodes.set(key, node);
    const prereqs = node.type === 'item' ? node.options.flatMap((o) => o.prereqs) : node.prereqs;
    for (const prereq of prereqs) addKey(prereq);
  };
  const addKey = (key: Key) => {
    if (key.startsWith('gate:')) addGate(key.slice(5));
    else {
      const [, file, id] = key.split(':') as [string, AcquisitionFile, string];
      addItem({ file, id: Number(id) });
    }
  };
  const addItem = (ref: ItemRef) =>
    visit(itemKey(ref), () => {
      const sources = data.items[ref.file][String(ref.id)] ?? [];
      const options: Option[] = [];
      const starts: Source[] = [];
      for (const source of sources) {
        if (source.kind === 'start') {
          starts.push(source);
          continue;
        }
        const place = placeOf(source);
        // A source without a place takes its prerequisite's (craft, alteration); a recipe known from the
        // start is there from the start; anything else is "elsewhere" (an enemy found all over).
        const resolved =
          place ?? (source.item ? null : source.kind === 'craft' ? START : ELSEWHERE);
        options.push({
          source,
          place: resolved,
          prereqs: [
            ...placeRequires(place).map(gateKey),
            ...(source.requires ?? []).map(gateKey),
            ...(source.item ? [itemKey(source.item)] : []),
          ],
        });
      }
      return { type: 'item', key: itemKey(ref), ref, options, starts };
    });
  const addGate = (id: string) =>
    visit(gateKey(id), () => {
      const gate = gates.get(id);
      if (!gate) throw new Error(`Unknown gate ${id}`);
      const place = gate.at == null ? null : placeOf({ location: gate.at, region: null });
      return {
        type: 'gate',
        key: gateKey(id),
        gate,
        place,
        prereqs: [
          ...placeRequires(place).map(gateKey),
          ...gate.requires.map(gateKey),
          ...(gate.item ? [itemKey(gate.item)] : []),
          ...(gate.anyOf?.gates.map(gateKey) ?? []),
        ],
      };
    });

  const needs: Key[] = [];
  const need = (key: Key) => {
    if (!needs.includes(key)) needs.push(key);
    addKey(key);
  };
  for (const ref of equipmentItems(equipment)) need(itemKey(ref));
  for (const id of impliedGates(equipment, data)) need(gateKey(id));

  // 2. Earliest time of every node, by relaxation (alterations can form cycles: A from B, B reverted from A).
  const time = new Map<Key, number>([...nodes.keys()].map((key) => [key, Infinity]));
  const t = (key: Key) => time.get(key) ?? Infinity;
  const optionTime = (option: Option) =>
    Math.max(option.place?.key ?? -Infinity, ...option.prereqs.map(t));
  const nodeTime = (node: Node): number => {
    if (node.type === 'item') {
      const best = Math.min(...node.options.map(optionTime));
      return Number.isFinite(best) || node.starts.length === 0 ? best : START.key;
    }
    const { anyOf } = node.gate;
    const members = anyOf?.gates.map(gateKey) ?? [];
    const fixed = node.prereqs.filter((key) => !members.includes(key));
    const chosen = anyOf ? anyOfTimes(anyOf, t).slice(0, anyOf.count) : [];
    return Math.max(node.place?.key ?? -Infinity, 0, ...fixed.map(t), ...chosen);
  };
  for (let round = 0, changed = true; changed && round <= nodes.size; round++) {
    changed = false;
    for (const node of nodes.values()) {
      const next = nodeTime(node);
      if (next < t(node.key)) {
        time.set(node.key, next);
        changed = true;
      }
    }
  }

  // 3. Choose: each needed item's best option, then what that pulls in. Any-of gates are settled last so
  // they can reuse gates the route has anyway (Radahn for the DLC counts towards two Great Runes).
  interface Chosen {
    node: Node;
    option?: Option;
    prereqs: Key[];
  }
  const chosen = new Map<Key, Chosen>();
  const pendingAnyOf: GateNode[] = [];
  const choosing = new Set<Key>();
  const choose = (key: Key) => {
    if (chosen.has(key)) return;
    const node = nodes.get(key);
    if (!node) return;
    if (node.type === 'item') {
      // Never an option that leads back to what's being chosen (altered ⇄ reverted armor).
      const options = node.options.filter((o) => !o.prereqs.some((p) => choosing.has(p)));
      const best = bestOption(options, optionTime);
      // Starting-class gear only when nothing else is reachable (owner's call, T15).
      const useStart =
        !Number.isFinite(best ? optionTime(best) : Infinity) && node.starts.length > 0;
      const option = useStart ? undefined : best;
      const prereqs = option?.prereqs ?? [];
      chosen.set(key, { node, option, prereqs });
      choosing.add(key);
      prereqs.forEach(choose);
      choosing.delete(key);
      return;
    }
    const anyOf = node.gate.anyOf?.gates.map(gateKey) ?? [];
    const prereqs = node.prereqs.filter((prereq) => !anyOf.includes(prereq));
    chosen.set(key, { node, prereqs });
    if (anyOf.length > 0) pendingAnyOf.push(node);
    prereqs.forEach(choose);
  };
  needs.forEach(choose);
  for (let node = pendingAnyOf.shift(); node; node = pendingAnyOf.shift()) {
    const { anyOf } = node.gate;
    if (!anyOf) continue;
    const members = [...anyOf.gates].sort(
      (a, b) =>
        Number(chosen.has(gateKey(b))) - Number(chosen.has(gateKey(a))) ||
        t(gateKey(a)) - t(gateKey(b)),
    );
    const picked = members.slice(0, anyOf.count).map(gateKey);
    chosen.get(node.key)?.prereqs.push(...picked);
    picked.forEach(choose);
  }

  // 4. Times of what was chosen (the relaxation may have counted an option the choice step ruled out),
  // the order (topological, earliest first), and where each node happens.
  const chosenTimes = new Map<Key, number>();
  const ct = (key: Key): number => {
    const known = chosenTimes.get(key);
    if (known !== undefined) return known;
    chosenTimes.set(key, Infinity); // cycle guard; choose() leaves none
    const entry = chosen.get(key);
    let own = -Infinity;
    if (entry?.node.type === 'gate') own = Math.max(entry.node.place?.key ?? 0, 0);
    else if (entry?.option) own = entry.option.place?.key ?? -Infinity;
    else if (entry) own = entry.node.starts.length > 0 ? START.key : Infinity;
    const value = Math.max(own, ...(entry?.prereqs ?? []).map(ct));
    chosenTimes.set(key, value);
    return value;
  };
  const places = new Map<Key, Place>();
  const placeOfChosen = (key: Key): Place => {
    const known = places.get(key);
    if (known) return known;
    places.set(key, ELSEWHERE); // cycle guard
    const entry = chosen.get(key);
    let place: Place = ELSEWHERE;
    if (entry) {
      const own = entry.node.type === 'item' ? entry.option?.place : entry.node.place;
      if (own) place = own;
      else if (entry.node.type === 'item' && !entry.option)
        place = entry.node.starts[0] ? START : ELSEWHERE;
      else {
        // No place of its own: it happens right after its latest prerequisite.
        const latest = [...entry.prereqs].sort((a, b) => ct(b) - ct(a))[0];
        place = latest ? placeOfChosen(latest) : START;
      }
    }
    places.set(key, place);
    return place;
  };

  const order = topoSort(chosen, ct, placeOfChosen);

  // Why prerequisites are on the route (T35): what each one unlocks, in route order, and the gates
  // that key items meet.
  const uses = new Map<Key, ItemUse[]>();
  const gateItems = new Map<Key, Gate>();
  for (const key of order) {
    const entry = chosen.get(key);
    if (entry?.node.type === 'gate' && entry.node.gate.item)
      gateItems.set(itemKey(entry.node.gate.item), entry.node.gate);
    const source = entry?.option?.source;
    if (entry?.node.type !== 'item' || !source?.item || !chosen.has(itemKey(source.item))) continue;
    const kind = sourceKind(entry.node, source);
    const list = uses.get(itemKey(source.item)) ?? [];
    const use = list.find((u) => u.kind === kind && u.detail === source.detail);
    if (use) use.items.push(entry.node.ref);
    else list.push({ kind, detail: source.detail, items: [entry.node.ref] });
    uses.set(itemKey(source.item), list);
  }

  // 5. Steps and legs.
  const legs: RouteLeg[] = [];
  let lastPlace: Place | null = null;
  for (const key of order) {
    const entry = chosen.get(key);
    if (!entry) continue;
    const action = actionOf(entry.node, entry.option);
    if (!action) continue;
    for (const item of action.items) {
      const usedFor = uses.get(itemKey(item.ref));
      const gate = gateItems.get(itemKey(item.ref));
      if (usedFor) item.usedFor = usedFor;
      if (gate) item.gate = gate;
    }
    const place = placeOfChosen(key);
    const legKind = place === START ? 'start' : place === ELSEWHERE ? 'elsewhere' : 'region';
    let leg = legs.at(-1);
    if (!leg || leg.kind !== legKind || leg.region?.id !== place.region?.id) {
      leg = { kind: legKind, region: place.region, steps: [] };
      legs.push(leg);
    }
    let step = leg.steps.at(-1);
    if (!step || lastPlace?.id !== place.id) {
      step = { location: place.location, actions: [] };
      leg.steps.push(step);
    }
    lastPlace = place;
    addAction(step, action);
  }
  return { legs };
}

/** Every item the build uses, deduplicated, in slot order. */
export function equipmentItems(equipment: Equipment): ItemRef[] {
  const refs: ItemRef[] = [];
  const add = (file: AcquisitionFile, id: number | null | undefined) => {
    if (id != null && !refs.some((ref) => ref.file === file && ref.id === id))
      refs.push({ file, id });
  };
  equipment.weapons.forEach((id) => add('weapons', id));
  equipment.weaponSkills.forEach((id, slot) => {
    if (equipment.weapons[slot] != null) add('ashesOfWar', id);
  });
  for (const id of [equipment.helm, equipment.chest, equipment.gauntlet, equipment.leg])
    add('armor', id);
  equipment.talismans.forEach((id) => add('talismans', id));
  equipment.spells.forEach((id) => add('spells', id));
  equipment.tears.forEach((id) => add('tears', id));
  add('greatRunes', equipment.greatRune);
  add('spiritAshes', equipment.spiritAsh);
  equipment.arrows.forEach((id) => add('arrows', id));
  equipment.consumables.forEach((id) => add('consumables', id));
  return refs;
}

/** Gates the build needs by what it is: the affinities' whetblades, the knife, the bell, the flask. */
function impliedGates(equipment: Equipment, data: Acquisition): string[] {
  const ids: string[] = [];
  const add = (id: string | null | undefined) => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  equipment.weapons.forEach((weapon, slot) => {
    const affinity = equipment.weaponAffinities[slot];
    if (weapon != null && affinity) add(data.implied.affinities[affinity]);
  });
  if (equipment.weaponSkills.some((id, slot) => id != null && equipment.weapons[slot] != null)) {
    add(data.implied.ashesOfWar);
  }
  if (equipment.spiritAsh != null) add(data.implied.spiritAshes);
  if (equipment.tears.length > 0) add(data.implied.tears);
  return ids;
}

const anyOfTimes = (anyOf: NonNullable<Gate['anyOf']>, t: (key: Key) => number) =>
  anyOf.gates.map((id) => t(gateKey(id))).sort((a, b) => a - b);

/** The earliest reachable option; ties keep the data's order (best first); none reachable = the first. */
function bestOption(options: Option[], time: (option: Option) => number): Option | undefined {
  let best = options[0];
  let bestTime = best ? time(best) : Infinity;
  for (const option of options) {
    const optionTime = time(option);
    if (optionTime < bestTime) [best, bestTime] = [option, optionTime];
  }
  return best;
}

/**
 * Kahn's algorithm. Among the ready nodes: the earliest time first; on a tie, stay at the same grace,
 * then in the same region (beat Godrick, then go restore his rune); then the order they were chosen.
 */
function topoSort(
  chosen: Map<Key, { prereqs: Key[] }>,
  time: (key: Key) => number,
  place: (key: Key) => Place,
): Key[] {
  const keys = [...chosen.keys()];
  const rank = new Map(keys.map((key, index) => [key, index]));
  const waiting = new Map(
    keys.map((key) => [key, new Set(chosen.get(key)?.prereqs.filter((p) => chosen.has(p)))]),
  );
  const order: Key[] = [];
  let here: Place | null = null;
  const priority = (key: Key) => {
    const there = place(key);
    return [
      time(key),
      there.id === here?.id ? 0 : 1,
      there.region && there.region.id === here?.region?.id ? 0 : 1,
      rank.get(key) ?? 0,
    ];
  };
  const before = (a: number[], b: number[]) => {
    const i = a.findIndex((value, index) => value !== b[index]);
    return i >= 0 && (a[i] ?? 0) < (b[i] ?? 0);
  };
  while (waiting.size > 0) {
    let next: Key | undefined;
    let best: number[] = [];
    for (const [key, prereqs] of waiting) {
      if (prereqs.size > 0) continue;
      const candidate = priority(key);
      if (next === undefined || before(candidate, best)) [next, best] = [key, candidate];
    }
    // A cycle can't survive the choice step (it never picks an option that leads back); guard anyway.
    next ??= waiting.keys().next().value as Key;
    waiting.delete(next);
    for (const prereqs of waiting.values()) prereqs.delete(next);
    order.push(next);
    here = place(next);
  }
  return order;
}

/** What a chosen node shows; null for gates that are only bookkeeping (any-of, or met by a key item). */
function actionOf(node: Node, option: Option | undefined): RouteAction | null {
  if (node.type === 'gate') {
    if (node.gate.anyOf || (node.gate.item && node.gate.at == null)) return null;
    const action: RouteAction = {
      kind: 'gate',
      detail: node.gate.label,
      items: [],
      gate: node.gate.id,
    };
    if (node.gate.reason) action.reason = node.gate.reason;
    return action;
  }
  const item: RouteItem = { ref: node.ref };
  if (!option) {
    const start = node.starts[0];
    return start
      ? { kind: 'start', detail: start.detail, items: [item] }
      : { kind: 'unknown', detail: '', items: [item] };
  }
  const { source } = option;
  if (source.cost) item.cost = source.cost;
  if (source.item) item.needs = source.item;
  if (node.starts.length > 0) item.startAlso = node.starts.map((start) => start.detail);
  return { kind: sourceKind(node, source), detail: source.detail, items: [item] };
}

/** A source's action kind: a Great Rune picked up with its unrestored one is restored. */
const sourceKind = (node: ItemNode, source: Source): ActionKind =>
  source.kind === 'pickup' && node.ref.file === 'greatRunes' && source.item
    ? 'restore'
    : source.kind;

/**
 * Adds an action to a step, merging it with a matching one (same kind and who). A boss that's also a
 * gate here ("Defeat Godrick the Grafted") folds its items into the gate's line.
 */
function addAction(step: RouteStep, action: RouteAction) {
  const same = step.actions.find((a) => a.kind === action.kind && a.detail === action.detail);
  if (same) {
    same.items.push(...action.items);
    return;
  }
  if (action.kind === 'boss' && action.detail) {
    const gate = step.actions.find((a) => a.kind === 'gate' && a.detail.includes(action.detail));
    if (gate) {
      gate.items.push(...action.items);
      return;
    }
  }
  if (action.kind === 'gate') {
    const boss = step.actions.findIndex(
      (a) => a.kind === 'boss' && a.detail !== '' && action.detail.includes(a.detail),
    );
    const existing = step.actions[boss];
    if (existing) {
      step.actions[boss] = { ...action, items: existing.items };
      return;
    }
  }
  step.actions.push(action);
}
