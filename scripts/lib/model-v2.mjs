// Firestore data model v2 for Node scripts (seed, migration), mirroring src/lib/models.ts and the
// level formula in src/lib/buildMath.ts. firestore.rules is the source of truth for the limits.
export const GAME = 'elden-ring';
export const STAT_KEYS = ['vigor', 'mind', 'end', 'str', 'dex', 'int', 'fai', 'arc'];
export const LIMITS = {
  buildName: 80,
  description: 20000,
  tags: 20,
  displayName: 40,
  comment: 1000,
};

const SLOT_COUNTS = { weapons: 6, arrows: 4, talismans: 4, spells: 10, tears: 2, consumables: 10 };

/** A stat as v2 stores it: an integer from 1 to 99 (v1 also had numeric strings). */
export function toStat(value) {
  const number = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(number)) return 10;
  return Math.min(99, Math.max(1, Math.round(number)));
}

export const calculateLevel = (stats) =>
  Math.max(STAT_KEYS.reduce((sum, key) => sum + stats[key], 0) - 79, 1);

const name = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);

/** Exactly `length` entries, null for empty or missing slots. */
const positional = (list, length) =>
  Array.from({ length }, (_, i) => (Array.isArray(list) ? name(list[i]) : null));

/** Non-empty names only, at most `max`. */
const compacted = (list, max) =>
  (Array.isArray(list) ? list : []).map(name).filter(Boolean).slice(0, max);

/** The `equipment` map from loose input (missing groups become empty). */
export function toEquipment(e = {}) {
  return {
    weapons: positional(e.weapons, SLOT_COUNTS.weapons),
    weaponAffinities: positional(e.weaponAffinities, SLOT_COUNTS.weapons),
    weaponSkills: positional(e.weaponSkills, SLOT_COUNTS.weapons),
    arrows: positional(e.arrows, SLOT_COUNTS.arrows),
    talismans: compacted(e.talismans, SLOT_COUNTS.talismans),
    spells: compacted(e.spells, SLOT_COUNTS.spells),
    tears: compacted(e.tears, SLOT_COUNTS.tears),
    consumables: compacted(e.consumables, SLOT_COUNTS.consumables),
    helm: name(e.helm),
    chest: name(e.chest),
    gauntlet: name(e.gauntlet),
    leg: name(e.leg),
  };
}

/** The owner-editable fields of a build doc, valid under firestore.rules. */
export function buildContent({ name: rawName, description, tags, stats, equipment }) {
  const buildName = (name(rawName) ?? 'Untitled build').slice(0, LIMITS.buildName).trim();
  const cleanStats = Object.fromEntries(STAT_KEYS.map((key) => [key, toStat(stats?.[key])]));
  return {
    name: buildName,
    nameLower: buildName.toLowerCase(),
    description: typeof description === 'string' ? description.slice(0, LIMITS.description) : '',
    tags: [...new Set(compacted(tags, Infinity))].slice(0, LIMITS.tags),
    level: calculateLevel(cleanStats),
    stats: cleanStats,
    equipment: toEquipment(equipment),
  };
}

/** A display name valid under firestore.rules (trimmed, 1–40 characters). */
export const toDisplayName = (value) =>
  (name(value) ?? 'Tarnished').slice(0, LIMITS.displayName).trim();

/** Comment text valid under firestore.rules, or null if nothing is left. */
export const toCommentText = (value) => name(value)?.slice(0, LIMITS.comment).trim() || null;
