// The few facts a player wants about an item at a glance (T45): the build sidebar's item card, the
// Guide's route icons and the phone rows. Pure: a slot entry in (the editor state's items are full data
// objects), its facts out. Editor-only: it reads weapon types from '@/data'.
import {
  getWeaponType,
  scalingGrade,
  type Armor,
  type Arrow,
  type Goods,
  type Spell,
  type SpiritAsh,
  type Talisman,
  type Weapon,
} from '@/data';
import type { RequirementCheck, RequirementStat } from '@/lib/buildMath';
import { slotWeaponDetails, type SlotEntry } from './gear';
import { STAT_ABBREVIATIONS } from './itemDetails';
import {
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
} from './slots';

/** One value in a row: "Str D", "Str 18" (`unmet` when this build's stats fall short). */
export interface FactPart {
  text: string;
  unmet?: boolean;
}

/** A labelled row of the card: Scaling, Requires, Weight, Poise, FP, Slots, Cost. */
export interface FactRow {
  label: string;
  parts: FactPart[];
  /** The row in the phone rows' compact line ("5.5 wt"); none for requirements (the warning covers them). */
  short?: string;
}

export interface ItemFacts {
  /** What it is: "Katana", "Chest armor", "Talisman", "Sorcery", "Spirit Ash". */
  kind: string;
  /** A weapon's affinity and skill with its FP cost ("Blood · Seppuku (4 FP)"), else ''. */
  subline: string;
  rows: FactRow[];
  /** The game's short description, '' when it says nothing useful. */
  effect: string;
}

const STATS: RequirementStat[] = ['str', 'dex', 'int', 'fai', 'arc'];
const ARMOR_KINDS: Record<string, string> = {
  [SLOT_TYPE_HELM]: 'Helm',
  [SLOT_TYPE_CHEST]: 'Chest armor',
  [SLOT_TYPE_GAUNTLET]: 'Gauntlets',
  [SLOT_TYPE_LEG]: 'Leg armor',
};

/** Weights as the game shows them: one decimal ("5.5", "12.0"). */
const weight = (value: number): FactRow => ({
  label: 'Weight',
  parts: [{ text: value.toFixed(1) }],
  short: `${value.toFixed(1)} wt`,
});

/** The stats an item needs, each flagged when this build doesn't have it; null when it needs none. */
function requires(
  requirements: Partial<Record<RequirementStat, number>>,
  check: RequirementCheck | undefined,
): FactRow | null {
  const unmet = new Set(check?.missing.map(({ stat }) => stat));
  const parts = STATS.filter((stat) => (requirements[stat] ?? 0) > 0).map((stat) => ({
    text: `${STAT_ABBREVIATIONS[stat]} ${requirements[stat]}`,
    ...(unmet.has(stat) ? { unmet: true } : {}),
  }));
  return parts.length ? { label: 'Requires', parts } : null;
}

function weaponFacts(entry: SlotEntry, weapon: Weapon): ItemFacts {
  const details = slotWeaponDetails(entry);
  const skill = details?.skill
    ? `${details.skill.name}${details.skill.fp > 0 ? ` (${details.skill.fp} FP)` : ''}`
    : null;
  const values = weapon.scaling[entry.affinity ?? 'standard'] ?? weapon.scaling.standard ?? [];
  const grades = STATS.flatMap((stat, index) => {
    const grade = scalingGrade(values[index] ?? 0);
    return grade ? [{ text: `${STAT_ABBREVIATIONS[stat]} ${grade}` }] : [];
  });
  const rows: (FactRow | null)[] = [
    grades.length
      ? { label: 'Scaling', parts: grades, short: grades.map(({ text }) => text).join(' ') }
      : null,
    requires(weapon.requirements, entry.check),
    weight(weapon.weight),
  ];
  return {
    kind: getWeaponType(weapon.type)?.name ?? 'Weapon',
    subline: [details?.affinity, skill].filter(Boolean).join(' · '),
    rows: rows.filter((row) => row !== null),
    effect: '',
  };
}

function spellFacts(entry: SlotEntry, spell: Spell): ItemFacts {
  const slots = `${spell.slots} ${spell.slots === 1 ? 'slot' : 'slots'}`;
  const rows: (FactRow | null)[] = [
    { label: 'FP', parts: [{ text: String(spell.fp) }], short: `${spell.fp} FP` },
    { label: 'Slots', parts: [{ text: String(spell.slots) }], short: slots },
    requires(spell.requirements, entry.check),
  ];
  return {
    kind: spell.kind === 'sorcery' ? 'Sorcery' : 'Incantation',
    subline: '',
    rows: rows.filter((row) => row !== null),
    effect: spell.effect,
  };
}

function spiritAshFacts(ash: SpiritAsh): ItemFacts {
  const cost = [ash.fp ? `${ash.fp} FP` : null, ash.hp ? `${ash.hp} HP` : null].filter(
    (part): part is string => part !== null,
  );
  return {
    kind: 'Spirit Ash',
    subline: '',
    rows: cost.length
      ? [{ label: 'Cost', parts: cost.map((text) => ({ text })), short: cost.join(' · ') }]
      : [],
    // "Summons spirit of Black Knife Tiche" repeats the name.
    effect: '',
  };
}

const goodsFacts = (kind: string, goods: Goods): ItemFacts => ({
  kind,
  subline: '',
  rows: [],
  effect: goods.effect,
});

/** A filled slot's facts, or null for an empty one. */
export function itemFacts(entry: SlotEntry): ItemFacts | null {
  // The editor state's items are full data objects; the slot type says which.
  const { item, type } = entry;
  if (!item) return null;
  switch (type) {
    case SLOT_TYPE_WEAPON:
      return weaponFacts(entry, item as Weapon);
    case SLOT_TYPE_ARROW: {
      const arrow = item as Arrow;
      return {
        kind: getWeaponType(arrow.type)?.name ?? 'Arrow',
        subline: '',
        rows: [weight(arrow.weight)],
        effect: '',
      };
    }
    case SLOT_TYPE_HELM:
    case SLOT_TYPE_CHEST:
    case SLOT_TYPE_GAUNTLET:
    case SLOT_TYPE_LEG: {
      const armor = item as Armor;
      return {
        kind: ARMOR_KINDS[type] ?? 'Armor',
        subline: '',
        rows: [
          weight(armor.weight),
          { label: 'Poise', parts: [{ text: String(armor.poise) }], short: `${armor.poise} poise` },
        ],
        effect: '',
      };
    }
    case SLOT_TYPE_TAL: {
      const talisman = item as Talisman;
      return {
        kind: 'Talisman',
        subline: '',
        rows: [weight(talisman.weight)],
        effect: talisman.effect,
      };
    }
    case SLOT_TYPE_SPELL:
      return spellFacts(entry, item as Spell);
    case SLOT_TYPE_SPIRIT_ASH:
      return spiritAshFacts(item as SpiritAsh);
    case SLOT_TYPE_TEAR:
      return goodsFacts('Crystal Tear', item as Goods);
    case SLOT_TYPE_GREAT_RUNE:
      return goodsFacts('Great Rune', item as Goods);
    case SLOT_TYPE_CON:
      return goodsFacts('Item', item as Goods);
    default:
      return null;
  }
}

/**
 * The phone rows' muted lines (no hover there): the weapon's affinity and skill or the effect, then
 * the rows in short ("Str D Dex D · 5.5 wt"); at most two lines.
 */
export function factsLines(facts: ItemFacts): string[] {
  const shorts = facts.rows.flatMap((row) => (row.short ? [row.short] : [])).join(' · ');
  return [facts.subline, facts.effect, shorts].filter(Boolean).slice(0, 2);
}

/** The facts as sentences, for screen readers (`aria-describedby` on a sidebar tile). */
export function factsText(facts: ItemFacts): string {
  const rows = facts.rows.map(
    ({ label, parts }) =>
      `${label}: ${parts.map(({ text, unmet }) => (unmet ? `${text} (not met)` : text)).join(', ')}.`,
  );
  return [`${facts.kind}.`, facts.subline ? `${facts.subline}.` : '', ...rows, facts.effect]
    .filter(Boolean)
    .join(' ');
}
