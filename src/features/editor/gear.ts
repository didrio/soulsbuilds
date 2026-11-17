// The build's gear as groups of slots (T48): what the build sidebar shows as tiles (and, T49, the phone
// sections as rows). Pure: the editor state in, the groups out.
import type { AffinityKey, AshOfWar, SlotDisplayItem, Weapon } from '@/data/core';
import type { RequirementCheck } from '@/lib/buildMath';
import { itemWarning, weaponDetails, type ItemWarning, type WeaponDetails } from './itemDetails';
import {
  ARMOR_SLOTS,
  ARROW_SLOTS,
  CONSUMABLE_SLOTS,
  SLOT_TYPE_ARROW,
  SLOT_TYPE_CHEST,
  SLOT_TYPE_CON,
  SLOT_TYPE_GAUNTLET,
  SLOT_TYPE_GREAT_RUNE,
  SLOT_TYPE_HELM,
  SLOT_TYPE_LEG,
  SLOT_TYPE_SPELL,
  SLOT_TYPE_SPIRIT_ASH,
  SLOT_TYPE_TAL,
  SLOT_TYPE_TEAR,
  SLOT_TYPE_WEAPON,
  SPELL_SLOTS,
  TALISMAN_SLOTS,
  TEAR_SLOTS,
  WEAPON_AFFINITY_SLOTS,
  WEAPON_SKILL_SLOTS,
  WEAPON_SLOTS,
  type ArmorSlot,
  type ItemSlot,
  type SlotType,
  type WeaponAffinitySlot,
  type WeaponSkillSlot,
} from './slots';
import type { EquipmentState } from './store/equipment';
import type { SpellsState } from './store/spells';
import type { TearsState } from './store/tears';

/** One slot of a build, as the sidebar and the item rows show it. */
export interface SlotEntry {
  /** Editor slot the picker writes to. */
  id: ItemSlot;
  type: SlotType;
  item: SlotDisplayItem | null;
  /** Weapon slots: the slots that hold its affinity and Ash of War, and their values. */
  affinityId?: WeaponAffinitySlot;
  subId?: WeaponSkillSlot;
  affinity?: AffinityKey | null;
  ash?: AshOfWar | null;
  /** Unmet requirements or no room in the memory slots (T8). */
  warning?: ItemWarning | null;
  /** Weapons and spells: their requirements against the build's stats (the item card flags each, T45). */
  check?: RequirementCheck;
}

/** A weapon slot's affinity and skill as built, or null for any other slot (or an empty one). */
export const slotWeaponDetails = ({
  type,
  item,
  affinity = null,
  ash = null,
}: SlotEntry): WeaponDetails | null =>
  // A weapon slot holds a weapon (the editor state's items are full data objects).
  item && type === SLOT_TYPE_WEAPON ? weaponDetails(item as Weapon, ash, affinity) : null;

/**
 * The filled slots plus the first empty one, for groups a build saves compacted (spells,
 * consumables): their slot positions aren't kept, so ten "Choose" slots would add nothing.
 */
export const filledAndNext = (entries: SlotEntry[]) => {
  const filled = entries.filter((entry) => entry.item);
  const next = entries.find((entry) => !entry.item);
  return next ? [...filled, next] : filled;
};

export type GearGroupKey =
  | 'armaments'
  | 'rightHand'
  | 'leftHand'
  | 'arrows'
  | 'armor'
  | 'talismans'
  | 'spells'
  | 'flask'
  | 'items';

export interface GearGroup {
  key: GearGroupKey;
  title: string;
  entries: SlotEntry[];
  /** Spells: the memory slots the spells take, of the ones the build has. */
  memory?: { used: number; available: number };
}

/** The editor state the groups come from (store selectors). */
export interface GearState {
  equipment: EquipmentState;
  tears: TearsState;
  spells: SpellsState;
  checks: Partial<Record<ItemSlot, RequirementCheck>>;
  /** Spell slots whose spell doesn't fit in the memory slots. */
  over: ReadonlySet<ItemSlot>;
  memory: { used: number; available: number };
}

const ARMOR_TYPES: Record<ArmorSlot, SlotType> = {
  helm: SLOT_TYPE_HELM,
  chest: SLOT_TYPE_CHEST,
  gauntlet: SLOT_TYPE_GAUNTLET,
  leg: SLOT_TYPE_LEG,
};

const filled = (entries: SlotEntry[]) => entries.filter((entry) => entry.item);

/**
 * The gear, grouped. Read-only: the filled slots only, and a group with none is left out; the
 * armaments are the right hand, then the left (the main weapon first), then arrows and bolts.
 * Editable: every slot, so each can be chosen: each hand and the arrows as their own group, and the
 * spells and items (saved compacted) as the filled ones plus one to choose next (spells only while
 * memory slots are free).
 */
export function gearGroups(state: GearState, editable: boolean): GearGroup[] {
  const { equipment, tears, spells, checks, over, memory } = state;

  const weapon = (index: number): SlotEntry => {
    const id = WEAPON_SLOTS[index]!;
    const affinityId = WEAPON_AFFINITY_SLOTS[index]!;
    const subId = WEAPON_SKILL_SLOTS[index]!;
    return {
      id,
      type: SLOT_TYPE_WEAPON,
      item: equipment[id],
      affinityId,
      subId,
      affinity: equipment[affinityId],
      ash: equipment[subId],
      warning: itemWarning(checks[id]),
      check: checks[id],
    };
  };
  // Weapon slots 1–3 are the right hand, 4–6 the left.
  const rightHand = [0, 1, 2].map(weapon);
  const leftHand = [3, 4, 5].map(weapon);
  const arrows = ARROW_SLOTS.map((id): SlotEntry => ({
    id,
    type: SLOT_TYPE_ARROW,
    item: equipment[id],
  }));
  const armor = ARMOR_SLOTS.map((id): SlotEntry => ({
    id,
    type: ARMOR_TYPES[id],
    item: equipment[id],
  }));
  const talismans = TALISMAN_SLOTS.map((id): SlotEntry => ({
    id,
    type: SLOT_TYPE_TAL,
    item: equipment[id],
  }));
  const spellEntries = SPELL_SLOTS.map((id): SlotEntry => ({
    id,
    type: SLOT_TYPE_SPELL,
    item: spells[id],
    warning: itemWarning(checks[id], over.has(id)),
    check: checks[id],
  }));
  const flask: SlotEntry[] = [
    ...TEAR_SLOTS.map((id): SlotEntry => ({ id, type: SLOT_TYPE_TEAR, item: tears[id] })),
    { id: 'greatRune', type: SLOT_TYPE_GREAT_RUNE, item: equipment.greatRune },
    { id: 'spiritAsh', type: SLOT_TYPE_SPIRIT_ASH, item: equipment.spiritAsh },
  ];
  const items = CONSUMABLE_SLOTS.map((id): SlotEntry => ({
    id,
    type: SLOT_TYPE_CON,
    item: equipment[id],
  }));

  if (!editable) {
    const groups: GearGroup[] = [
      {
        key: 'armaments',
        title: 'Armaments',
        entries: filled([...rightHand, ...leftHand, ...arrows]),
      },
      { key: 'armor', title: 'Armor', entries: filled(armor) },
      { key: 'talismans', title: 'Talismans', entries: filled(talismans) },
      { key: 'spells', title: 'Spells', entries: filled(spellEntries), memory },
      { key: 'flask', title: 'Tears, rune and ash', entries: filled(flask) },
      { key: 'items', title: 'Items', entries: filled(items) },
    ];
    return groups.filter((group) => group.entries.length > 0);
  }

  const nextSpell =
    memory.available > memory.used ? spellEntries.find((entry) => !entry.item) : undefined;
  return [
    { key: 'rightHand', title: 'Right hand', entries: rightHand },
    { key: 'leftHand', title: 'Left hand', entries: leftHand },
    { key: 'arrows', title: 'Arrows and bolts', entries: arrows },
    { key: 'armor', title: 'Armor', entries: armor },
    { key: 'talismans', title: 'Talismans', entries: talismans },
    {
      key: 'spells',
      title: 'Spells',
      entries: [...filled(spellEntries), ...(nextSpell ? [nextSpell] : [])],
      memory,
    },
    { key: 'flask', title: 'Tears, rune and ash', entries: flask },
    { key: 'items', title: 'Items', entries: filledAndNext(items) },
  ];
}

/** The Equipment panel's slots that always show, empty ones as placeholders (the game's fixed layout). */
const FIXED_GROUPS: ReadonlySet<GearGroupKey> = new Set([
  'rightHand',
  'leftHand',
  'armor',
  'talismans',
  'flask',
]);

/**
 * The Equipment tab's panel (T63): laid out like the game's equipment screen, each hand on its own.
 * Editable: every slot to choose (`gearGroups`). Read-only: the hands, armor, talismans and flask with
 * all their slots (empty ones hold their place), and the arrows, spells and items only as far as the
 * build has any (a group with none is left out).
 */
export function equipmentGroups(state: GearState, editable: boolean): GearGroup[] {
  const groups = gearGroups(state, true);
  if (editable) return groups;
  return groups.flatMap((group) => {
    if (FIXED_GROUPS.has(group.key)) return [group];
    const entries = filled(group.entries);
    return entries.length ? [{ ...group, entries }] : [];
  });
}

/** Where each group sits in the Equipment panel: the hands, armor and talismans, then the rest. */
const PANEL_ORDER: GearGroupKey[] = [
  'rightHand',
  'leftHand',
  'armor',
  'talismans',
  'flask',
  'arrows',
  'spells',
  'items',
];

/** Up to this many tiles, a group takes half the Equipment panel's width (T66; five 68 px tiles fit in half the panel on desktop). */
export const HALF_WIDTH_TILES = 5;

export interface PanelCell {
  group: GearGroup;
  /** Across the panel rather than half of it. */
  wide: boolean;
}

/**
 * The Equipment panel's cells in reading order (T66, so a full build fits above the fold): the hands
 * side by side, armor beside talismans, then the flask, arrows, spells and items packed two to a row.
 * A group with more than `HALF_WIDTH_TILES` tiles takes the row to itself, and so does a half-width
 * group left alone on its row (the flask with nothing beside it), so no row ends half empty.
 */
export function equipmentLayout(groups: GearGroup[]): PanelCell[] {
  const byKey = new Map(groups.map((group) => [group.key, group]));
  const cells: PanelCell[] = PANEL_ORDER.flatMap((key) => {
    const group = byKey.get(key);
    return group ? [{ group, wide: group.entries.length > HALF_WIDTH_TILES }] : [];
  });
  let secondHalf = false;
  return cells.map((cell, index) => {
    if (cell.wide) {
      secondHalf = false;
      return cell;
    }
    if (secondHalf) {
      secondHalf = false;
      return cell;
    }
    const next = cells[index + 1];
    if (!next || next.wide) return { ...cell, wide: true };
    secondHalf = true;
    return cell;
  });
}
