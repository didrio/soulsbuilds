#!/usr/bin/env node
// Seeds the LOCAL Firebase emulators (project demo-soulsbuilds) with test users, builds, likes and
// comments in data model v2 (docs/architecture.md), so the app has data to show. `npm run dev` runs
// this automatically; `npm run seed` re-runs it against already-running emulators, after WIPING
// their Firestore data. It refuses to run against anything but localhost.
//
// Test accounts (emulator only, password for all: see SEED_PASSWORD):
//   tarnished@example.test  "Tarnished"   owns 2 builds
//   ranni@example.test      "Ranni Fan"   owns 2 builds, liked one of Tarnished's
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { fitAffinity, fitAsh, talismanConflict } from '../src/data/rules.ts';
import { buildContent, GAME } from './lib/model-v2.mjs';

export const SEED_PASSWORD = 'seed-password-123';
const PROJECT_ID = 'demo-soulsbuilds';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const firebaseJson = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
const { auth: authEmu, firestore: fsEmu } = firebaseJson.emulators;
process.env.FIRESTORE_EMULATOR_HOST ??= `${fsEmu.host}:${fsEmu.port}`;
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= `${authEmu.host}:${authEmu.port}`;

for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
  if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(process.env[name])) {
    console.error(`✗ ${name}=${process.env[name]} is not a local emulator. Refusing to seed.`);
    process.exit(1);
  }
}

// Game data v2 (src/data/er/). Seed builds name their items; toEquipmentIds() looks the IDs up.
const er = (file) =>
  JSON.parse(readFileSync(join(root, 'src', 'data', 'er', `${file}.json`), 'utf8'));
const DATA = Object.fromEntries(
  [
    'weapons',
    'armor',
    'arrows',
    'talismans',
    'spells',
    'tears',
    'consumables',
    'greatRunes',
    'spiritAshes',
    'ashesOfWar',
    'skills',
  ].map((file) => [file, er(file)]),
);

const at = (month, day) => Timestamp.fromDate(new Date(Date.UTC(2026, month - 1, day, 12)));

const USERS = [
  {
    uid: 'seed-tarnished',
    name: 'Tarnished',
    email: 'tarnished@example.test',
    createdAt: at(9, 1),
  },
  { uid: 'seed-ranni', name: 'Ranni Fan', email: 'ranni@example.test', createdAt: at(9, 3) },
];

const stats = (vigor, mind, end, str, dex, int, fai, arc) => ({
  vigor,
  mind,
  end,
  str,
  dex,
  int,
  fai,
  arc,
});
const noWeapons = [null, null, null, null, null, null];

// Builds with item names (as in the game); main() turns them into v2 documents with item IDs.
const BUILDS = [
  {
    id: 'SEEDBLEED001',
    ownerId: 'seed-tarnished',
    createdAt: at(10, 2),
    name: 'Bloodhound Samurai',
    description:
      'A **bleed** build around Rivers of Blood.\n\n- Level 131\n- Two-hand the katana\n- Swap to the Uchigatana for long fights',
    tags: ['Malenia', 'Mohg'],
    likedBy: ['seed-ranni'],
    comments: [
      {
        id: 'seedcomment01',
        authorId: 'seed-ranni',
        text: 'Corpse Piler is absurd in PvE. Nice build!',
        createdAt: at(11, 1),
      },
    ],
    stats: stats(50, 15, 25, 18, 40, 9, 8, 45),
    equipment: {
      weapons: ['Rivers of Blood', null, null, 'Uchigatana', null, null],
      weaponAffinities: [null, null, null, 'blood', null, null],
      // Ashes of War by the skill they grant; null = the weapon's built-in skill.
      weaponSkills: [null, null, null, 'Seppuku', null, null],
      talismans: [
        "Lord of Blood's Exultation",
        'Rotten Winged Sword Insignia',
        "Millicent's Prosthesis",
        'Shard of Alexander',
      ],
      tears: ['Opaline Hardtear', 'Crimson Crystal Tear'],
      helm: 'White Mask',
      chest: 'Raging Wolf Armor',
      gauntlet: 'Raging Wolf Gauntlets',
      leg: 'Raging Wolf Greaves',
      greatRune: "Mohg's Great Rune",
      spiritAsh: 'Mimic Tear Ashes',
    },
  },
  {
    id: 'SEEDMOON0001',
    ownerId: 'seed-ranni',
    createdAt: at(10, 5),
    name: 'Carian Moon Knight',
    description: 'Moonveil and full-moon sorceries. Quality-of-life INT build.',
    tags: ['Rennala', 'Rykard'],
    likedBy: [],
    comments: [],
    stats: stats(40, 30, 15, 12, 18, 80, 7, 9),
    equipment: {
      weapons: ['Moonveil', null, null, 'Carian Regal Scepter', null, null],
      talismans: [
        'Graven-Mass Talisman',
        'Magic Scorpion Charm',
        "Radagon's Soreseal",
        'Moon of Nokstella',
      ],
      spells: ["Rennala's Full Moon", 'Comet Azur', 'Rock Sling', 'Glintstone Pebble'],
      tears: ['Cerulean Hidden Tear', 'Stonebarb Cracked Tear'],
      helm: "Lusat's Glintstone Crown",
      chest: "Lusat's Robe",
      gauntlet: "Lusat's Manchettes",
      leg: "Old Sorcerer's Legwraps",
      greatRune: "Radahn's Great Rune",
      spiritAsh: 'Lone Wolf Ashes',
    },
  },
  {
    id: 'SEEDFAITH001',
    ownerId: 'seed-ranni',
    createdAt: at(10, 20),
    name: 'Blasphemous Paladin',
    description: 'Strength/faith hybrid with the Blasphemous Blade and buffs.',
    tags: ['Godrick'],
    likedBy: [],
    comments: [],
    stats: stats(45, 20, 25, 30, 12, 9, 60, 9),
    equipment: {
      weapons: ['Blasphemous Blade', null, null, 'Brass Shield', null, null],
      weaponSkills: [null, null, null, 'Barricade Shield', null, null],
      talismans: [
        "Erdtree's Favor +2",
        'Godfrey Icon',
        'Flamedrake Talisman +2',
        'Shard of Alexander',
      ],
      spells: ['Golden Vow', 'Flame, Grant Me Strength', 'Erdtree Heal'],
      tears: ['Opaline Hardtear', 'Greenburst Crystal Tear'],
    },
  },
  {
    id: 'SEEDNAKED001',
    ownerId: 'seed-tarnished',
    createdAt: at(11, 10),
    name: 'Wretch Speedrun',
    description: '',
    tags: [],
    likedBy: [],
    comments: [],
    stats: stats(10, 10, 10, 10, 10, 10, 10, 10),
    equipment: { weapons: ['Club', ...noWeapons.slice(1)] },
  },
];

const ARMOR_SLOTS = { helm: 'head', chest: 'chest', gauntlet: 'arms', leg: 'legs' };

/**
 * A seed build's equipment with item names turned into game IDs. Throws on a name that isn't in the
 * data, an Ash of War or affinity the weapon can't have, or talismans that can't be worn together,
 * so the seed never shows something the editor would drop.
 */
function toEquipmentIds({ id: buildId, equipment: e }) {
  const fail = (what) => {
    throw new Error(`Seed build ${buildId}: ${what}`);
  };
  const find = (file, name, matches = () => true) =>
    DATA[file].find((item) => item.name === name && matches(item)) ??
    fail(`no ${file} item "${name}"`);
  const ids = (file, names = []) => names.map((name) => (name ? find(file, name).id : null));
  const skillName = (ash) => DATA.skills.find((skill) => skill.id === ash.skill)?.name;

  const weapons = (e.weapons ?? []).map((name) => (name ? find('weapons', name) : null));
  const weaponSkills = weapons.map((weapon, i) => {
    const name = e.weaponSkills?.[i];
    if (!name) return null;
    const ash = find('ashesOfWar', `Ash of War: ${name}`, (a) => skillName(a) === name);
    if (!weapon || fitAsh(weapon, ash, DATA.ashesOfWar) !== ash)
      fail(`${weapon?.name ?? 'an empty slot'} can't take the Ash of War "${name}"`);
    return ash;
  });
  const weaponAffinities = weapons.map((weapon, i) => {
    const key = e.weaponAffinities?.[i] ?? null;
    if (key && (!weapon || fitAffinity(weapon, weaponSkills[i], key, DATA.ashesOfWar) !== key))
      fail(`${weapon?.name ?? 'an empty slot'} can't have the affinity "${key}"`);
    return key;
  });
  const talismans = (e.talismans ?? []).map((name) => find('talismans', name));
  talismans.forEach((talisman, i) => {
    const conflict = talismanConflict(talisman, talismans.slice(0, i));
    if (conflict) fail(`"${talisman.name}" can't be worn with "${conflict.name}"`);
  });
  const armor = Object.fromEntries(
    Object.entries(ARMOR_SLOTS).map(([slot, armorSlot]) => [
      slot,
      e[slot] ? find('armor', e[slot], (piece) => piece.slot === armorSlot).id : null,
    ]),
  );
  return {
    weapons: weapons.map((weapon) => weapon?.id ?? null),
    weaponAffinities,
    weaponSkills: weaponSkills.map((ash) => ash?.id ?? null),
    arrows: ids('arrows', e.arrows),
    talismans: talismans.map((talisman) => talisman.id),
    spells: ids('spells', e.spells),
    tears: ids('tears', e.tears),
    consumables: ids('consumables', e.consumables),
    ...armor,
    greatRune: e.greatRune ? find('greatRunes', e.greatRune).id : null,
    spiritAsh: e.spiritAsh ? find('spiritAshes', e.spiritAsh).id : null,
  };
}

// Empties the emulator's Firestore (emulator REST API), so re-seeding gives a known state.
async function clearFirestore() {
  const url = `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Could not clear Firestore (${response.status})`);
}

async function main() {
  // Resolve every name first: a typo fails before the emulator is touched.
  const contents = new Map(
    BUILDS.map((build) => [build.id, buildContent({ ...build, equipment: toEquipmentIds(build) })]),
  );
  initializeApp({ projectId: PROJECT_ID });
  const auth = getAuth();
  const db = getFirestore();
  await clearFirestore();

  for (const user of USERS) {
    try {
      await auth.deleteUser(user.uid);
    } catch {
      // not there yet
    }
    await auth.createUser({
      uid: user.uid,
      email: user.email,
      password: SEED_PASSWORD,
      displayName: user.name,
    });
    await db.doc(`users/${user.uid}`).set({ displayName: user.name, createdAt: user.createdAt });
  }

  for (const build of BUILDS) {
    const batch = db.batch();
    const ref = db.doc(`builds/${build.id}`);
    batch.set(ref, {
      ...contents.get(build.id),
      ownerId: build.ownerId,
      game: GAME,
      likeCount: build.likedBy.length,
      commentCount: build.comments.length,
      ...(build.comments.length ? { lastCommentId: build.comments.at(-1).id } : {}),
      createdAt: build.createdAt,
      updatedAt: build.createdAt,
    });
    for (const uid of build.likedBy) {
      batch.set(ref.collection('likes').doc(uid), { userId: uid, createdAt: build.createdAt });
    }
    for (const { id, ...comment } of build.comments) {
      batch.set(ref.collection('comments').doc(id), comment);
    }
    await batch.commit();
  }

  console.log(`✓ Seeded ${USERS.length} users and ${BUILDS.length} builds into ${PROJECT_ID}.`);
  console.log(
    `  Sign in as tarnished@example.test or ranni@example.test (password in scripts/seed.mjs).`,
  );
}

main().catch((error) => {
  console.error('✗ Seeding failed:', error.message);
  process.exit(1);
});
