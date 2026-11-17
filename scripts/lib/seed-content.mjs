// Seeded builds (T52): the files in content/builds/<game>/ → checked build content, ready to write. Each build
// is two files with the same name: `<slug>.json` (the loadout by item names, the source to credit) and
// `<slug>.md` (our write-up). The Admin SDK skips firestore.rules, so these checks are the gate: anything the
// editor or the rules wouldn't accept is an error, and so are gear the stats can't use and spells that don't
// fit. Pure apart from reading the files; scripts/seed-builds.mjs writes. Format: content/builds/README.md.
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateLevel,
  checkRequirements,
  effectiveStats,
  memorySlots,
  poise,
  rollType,
  STAT_KEYS,
  totalWeight,
  vitals,
} from '../../src/lib/buildMath.ts';
import { firstParagraph } from '../../src/lib/markdown.ts';
import { classId, imageOf, loadItemData, toEquipmentIds } from './build-from-names.mjs';
import { buildContent, LIMITS } from './model-v2.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SEED_DIR = join(ROOT, 'content', 'builds', 'er');

/** Who writes the write-ups and fills the gaps, in the credit line. */
export const SITE_AUTHOR = 'Souls Builds';

const ID = /^[A-Za-z0-9_-]{1,40}$/;
const HAND_SLOTS = 3;
const MAX = { talismans: 4, spells: 12, tears: 2, consumables: 10, arrows: 4 };
/** The share/search description is cut at 200 characters (src/lib/share.ts); this lead comes first. */
const DESCRIPTION_MAX = 200;
const FIELDS = new Set([
  'id',
  'name',
  'level',
  'startingClass',
  'stats',
  'rightHand',
  'leftHand',
  'arrows',
  'talismans',
  'spells',
  'tears',
  'consumables',
  'armor',
  'greatRune',
  'spiritAsh',
  'tags',
  'image',
  'source',
  'allowUnmet',
  'notes',
]);

/** "a", "a and b", "a, b and c". */
const joinAnd = (words) =>
  words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;

/**
 * The credit line under the write-up (T52), from the seed's `source`: the loadout's origin with a link,
 * what we filled in where the source left gaps, and who wrote the text. With `permission`, the text is
 * the author's own.
 */
export function creditLine({ author = null, site, title, url, filled = [], permission = null }) {
  const name = title.replace(/\s+build$/i, '');
  const link = `([original](${url}))`;
  if (permission)
    return `Build and write-up by ${author} on ${site} ${link}, shared with their permission.`;
  const whose = author ? `${author}'s ${name} build` : `the ${name} build`;
  const gaps = filled.length ? `; ${joinAnd(filled)} filled in by ${SITE_AUTHOR}` : '';
  return `Loadout from ${whose} on ${site} ${link}${gaps}. Write-up by ${SITE_AUTHOR}.`;
}

/** The published write-up: ours (or the author's), a rule, and the credit line in italics. */
export const withCredit = (writeUp, source) =>
  `${writeUp.trim()}\n\n---\n\n_${creditLine(source)}_`;

/** Every seed in `dir` as { file, seed, writeUp }, by file name. Throws on unreadable JSON. */
export function readSeeds(dir = SEED_DIR) {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const path = join(dir, file);
      let seed;
      try {
        seed = JSON.parse(readFileSync(path, 'utf8'));
      } catch (error) {
        throw new Error(`${file}: ${error.message}`);
      }
      let writeUp = null;
      try {
        writeUp = readFileSync(path.replace(/\.json$/, '.md'), 'utf8');
      } catch {
        // reported by checkSeed
      }
      return { file: basename(file, '.json'), seed, writeUp };
    });
}

/** A hand's `{ weapon, affinity, ash }` entries → 3 positional slots (affinity keys from the game's names). */
function handSlots(hand, data, errors, label) {
  const entries = hand ?? [];
  if (!Array.isArray(entries) || entries.length > HAND_SLOTS) {
    errors.push(`${label}: at most ${HAND_SLOTS} weapons`);
    return Array.from({ length: HAND_SLOTS }, () => ({ weapon: null, affinity: null, ash: null }));
  }
  return Array.from({ length: HAND_SLOTS }, (_, i) => {
    const entry = entries[i] ?? null;
    if (!entry?.weapon) return { weapon: null, affinity: null, ash: null };
    let affinity = null;
    if (entry.affinity && entry.affinity !== 'Standard') {
      const found = data.affinities.find(({ name }) => name === entry.affinity);
      if (found) affinity = found.key;
      else
        errors.push(`${label}: no affinity "${entry.affinity}" (use the game's name, e.g. Keen)`);
    }
    return { weapon: entry.weapon, affinity, ash: entry.ash ?? null };
  });
}

/**
 * Checks one seed against the game data and the rules. Resolves to { errors, notes, content, summary }:
 * `content` (the owner-editable build fields, IDs and the write-up with its credit line) only when there
 * are no errors; `notes` are what the owner should look at (two-handing, allowed exceptions); `summary` is
 * for the dry-run report.
 */
export function checkSeed({ file, seed, writeUp }, data = loadItemData()) {
  const errors = [];
  const notes = [];
  const label = `${file}`;
  const fail = (message) => errors.push(message);

  for (const key of Object.keys(seed)) if (!FIELDS.has(key)) fail(`unknown field "${key}"`);
  if (typeof seed.id !== 'string' || !ID.test(seed.id)) fail('id: 1–40 letters, digits, _ or -');
  const name = typeof seed.name === 'string' ? seed.name.trim() : '';
  if (!name || name !== seed.name || name.length > LIMITS.buildName)
    fail(`name: trimmed, 1–${LIMITS.buildName} characters`);
  if (writeUp === null) fail(`no write-up: add ${file}.md`);
  else if (!writeUp.trim()) fail(`${file}.md is empty`);

  // Source and credit.
  const source = seed.source ?? {};
  if (!source.site || !source.title) fail('source: site and title are required');
  if (!/^https:\/\/\S+$/.test(source.url ?? '')) fail('source.url: an https link to the original');
  if (source.permission && !source.author) fail('source.permission needs source.author');
  if (source.filled !== undefined && !Array.isArray(source.filled))
    fail('source.filled: a list (e.g. ["stats", "armor"])');

  // Stats and level.
  const stats = seed.stats ?? {};
  const statKeys = Object.keys(stats);
  if (
    statKeys.length !== STAT_KEYS.length ||
    !STAT_KEYS.every((key) => Number.isInteger(stats[key]) && stats[key] >= 1 && stats[key] <= 99)
  )
    fail(`stats: exactly ${STAT_KEYS.join(', ')}, each a whole number from 1 to 99`);
  const statsOk = !errors.some((message) => message.startsWith('stats:'));
  const level = statsOk ? calculateLevel(stats) : null;
  if (statsOk && seed.level !== level)
    fail(`level ${seed.level} doesn't match the stats (${level})`);

  // Starting class and its minimums.
  let startingClass = null;
  try {
    startingClass = classId(seed.startingClass, data, label);
  } catch (error) {
    fail(error.message.replace(`${label}: `, ''));
  }
  const klass = data.character.classes.find(({ id }) => id === startingClass);
  if (klass && statsOk) {
    const below = STAT_KEYS.filter((key) => stats[key] < klass.stats[key]);
    if (below.length)
      fail(
        `below the ${klass.name}'s base: ${below.map((k) => `${k} ${klass.stats[k]}`).join(', ')}`,
      );
  }

  // Tags.
  const tags = seed.tags ?? [];
  if (!Array.isArray(tags) || tags.length > LIMITS.tags) fail(`tags: at most ${LIMITS.tags}`);
  else {
    const unknown = tags.filter((tag) => !data.tags.has(tag));
    if (unknown.length) fail(`unknown tags: ${unknown.join(', ')} (src/data/er/tags.json)`);
    if (new Set(tags).size !== tags.length) fail('tags: no duplicates');
  }

  // Equipment by name → IDs (the strict conversion catches names, Ashes, affinities, talismans, armor).
  for (const [list, max] of Object.entries(MAX)) {
    const value = seed[list] ?? [];
    if (!Array.isArray(value) || value.length > max) fail(`${list}: at most ${max}`);
    else if (list !== 'arrows' && new Set(value).size !== value.length)
      fail(`${list}: no duplicates`);
  }
  const right = handSlots(seed.rightHand, data, errors, 'rightHand');
  const left = handSlots(seed.leftHand, data, errors, 'leftHand');
  const hands = [...right, ...left];
  const armor = seed.armor ?? {};
  const named = {
    weapons: hands.map(({ weapon }) => weapon),
    weaponAffinities: hands.map(({ affinity }) => affinity),
    weaponSkills: hands.map(({ ash }) => ash),
    arrows: seed.arrows ?? [],
    talismans: seed.talismans ?? [],
    spells: seed.spells ?? [],
    tears: seed.tears ?? [],
    consumables: seed.consumables ?? [],
    helm: armor.helm ?? null,
    chest: armor.chest ?? null,
    gauntlet: armor.gauntlet ?? null,
    leg: armor.leg ?? null,
    greatRune: seed.greatRune ?? null,
    spiritAsh: seed.spiritAsh ?? null,
  };
  let equipment = null;
  try {
    equipment = toEquipmentIds(named, data, label);
  } catch (error) {
    fail(error.message.replace(`${label}: `, ''));
  }
  if (!named.weapons.some(Boolean)) fail('no weapons: a build needs at least one');

  let image = null;
  try {
    image = imageOf(seed.image, data, label);
  } catch (error) {
    fail(error.message.replace(`${label}: `, ''));
  }

  let summary = null;
  if (equipment && statsOk) {
    const item = (file, id) => data[file].find((entry) => entry.id === id);
    const weapons = equipment.weapons.map((id) => item('weapons', id));
    const talismans = equipment.talismans.map((id) => item('talismans', id));
    const spells = equipment.spells.map((id) => item('spells', id));
    const armorPieces = ['helm', 'chest', 'gauntlet', 'leg'].map((slot) =>
      item('armor', equipment[slot]),
    );
    const arrows = equipment.arrows.map((id) => item('arrows', id));
    const modifiers = talismans.map((talisman) => talisman.modifiers).filter(Boolean);
    const effective = effectiveStats(stats, modifiers);
    const allowUnmet = new Set(seed.allowUnmet ?? []);

    // Requirements, as the editor shows them (src/features/editor/store/derived.ts).
    for (const gear of [...weapons, ...spells].filter(Boolean)) {
      const check = checkRequirements(gear.requirements, effective);
      const short = check.missing.map(({ stat, required }) => `${stat} ${required}`).join(', ');
      if (check.status === 'two-handed') notes.push(`${gear.name}: two-handed (needs ${short})`);
      else if (check.status === 'unmet' && allowUnmet.has(gear.name))
        notes.push(`${gear.name}: requirements unmet (${short}), allowed by allowUnmet`);
      else if (check.status === 'unmet') fail(`${gear.name}: the stats don't meet ${short}`);
    }
    for (const unused of allowUnmet)
      if (![...weapons, ...spells].some((gear) => gear?.name === unused))
        fail(`allowUnmet: "${unused}" isn't on the build`);

    // Memory slots for the spells.
    const available = memorySlots(modifiers);
    const used = spells.reduce((sum, spell) => sum + spell.slots, 0);
    if (used > available) fail(`spells need ${used} memory slots, the build has ${available}`);

    // The image must be on the build, or the app falls back to the main weapon silently.
    if (image) {
      const on = {
        weapon: equipment.weapons,
        helm: [equipment.helm],
        chest: [equipment.chest],
        gauntlet: [equipment.gauntlet],
        leg: [equipment.leg],
        talisman: equipment.talismans,
        spell: equipment.spells,
        tear: equipment.tears,
        greatRune: [equipment.greatRune],
        spiritAsh: [equipment.spiritAsh],
      }[image.kind];
      if (!on.includes(image.id)) fail(`image: ${seed.image.name} isn't on the build`);
    }

    const vital = vitals(data.character.curves, effective, modifiers);
    const weight = totalWeight(
      [...weapons, ...arrows, ...armorPieces, ...talismans].map((gear) => gear?.weight ?? 0),
    );
    const weaponLabel = (slot, i) => {
      const weapon = weapons[i];
      if (!weapon) return null;
      const affinity = slot.affinity
        ? data.affinities.find(({ key }) => key === slot.affinity).name
        : null;
      const extras = [affinity, slot.ash].filter(Boolean);
      return extras.length ? `${weapon.name} (${extras.join(', ')})` : weapon.name;
    };
    summary = {
      className: klass?.name ?? 'no class',
      right: right.map((slot, i) => weaponLabel(slot, i)).filter(Boolean),
      left: left.map((slot, i) => weaponLabel(slot, i + HAND_SLOTS)).filter(Boolean),
      talismans: talismans.map((talisman) => talisman.name),
      spells: spells.map((spell) => spell.name),
      memory: `${used}/${available}`,
      armor: armorPieces.map((piece) => piece?.name ?? '—'),
      vitals: vital,
      weight,
      roll: rollType(weight, vital.equipLoad),
      poise: poise(
        armorPieces.map((piece) => piece?.poise ?? 0),
        modifiers,
      ),
    };
    if (summary.roll === 'heavy' || summary.roll === 'overloaded')
      notes.push(`${summary.roll} roll: ${weight}/${vital.equipLoad}`);
  }

  let content = null;
  if (!errors.length) {
    const description = withCredit(writeUp, source);
    if (description.length > LIMITS.description)
      fail(`the write-up with its credit is over ${LIMITS.description} characters`);
    const lead = `Level ${level} Elden Ring build by ${SITE_AUTHOR}. ${firstParagraph(writeUp)}`;
    if (lead.length > DESCRIPTION_MAX)
      notes.push(
        `search description cut at ${DESCRIPTION_MAX} (${lead.length}): shorten the first paragraph`,
      );
    if (summary) summary.searchDescription = lead;
    if (!errors.length)
      content = {
        ...buildContent({ name, description, tags, stats, equipment }),
        startingClass,
        image,
      };
  }
  return { errors, notes, content, summary };
}

/** Every seed checked: [{ file, seed, errors, notes, content, summary }]. */
export function checkSeeds(seeds = readSeeds(), data = loadItemData()) {
  return seeds.map((entry) => ({ file: entry.file, seed: entry.seed, ...checkSeed(entry, data) }));
}
