#!/usr/bin/env node
// Seeds the LOCAL Firebase emulators (project demo-soulsbuilds) with test users and builds, so the
// app has data to show. `npm run dev` runs this automatically; `npm run seed` re-runs it against
// already-running emulators (`npm run emulators`). It refuses to run against anything but localhost.
//
// Test accounts (emulator only, password for all: see SEED_PASSWORD):
//   tarnished@example.test  "Tarnished"   owns 2 builds
//   ranni@example.test      "Ranni Fan"   owns 2 builds, liked one of Tarnished's
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

const data = (file) => JSON.parse(readFileSync(join(root, 'src', 'data', file), 'utf8'));
const weapons = data('weaponsAndShields.json');
const armor = data('armorIndexed.json');
const talismans = new Set(data('talismans.json').map((t) => t.name));
const spells = new Set(data('spells.json').map((s) => s.name));
const tears = new Set(data('tears.json').map((t) => t.name));
const skills = data('skillsIndexed.json');
const { affinities } = data('affinities.json');

const USERS = [
  { uid: 'seed-tarnished', name: 'Tarnished', email: 'tarnished@example.test' },
  { uid: 'seed-ranni', name: 'Ranni Fan', email: 'ranni@example.test' },
];

// v1 build documents, exactly as BuildEditor's handleSave writes them (see docs/architecture.md).
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
const BUILDS = [
  {
    id: 'SEEDBLEED001',
    user: 'seed-tarnished',
    name: 'Bloodhound Samurai',
    description:
      'A **bleed** build around Rivers of Blood.\n\n- Level 131\n- Two-hand the katana\n- Swap to the Uchigatana for long fights',
    tags: ['Malenia', 'Mohg'],
    likes: 1,
    comments: [
      {
        user: 'seed-ranni',
        comment: 'Corpse Piler is absurd in PvE. Nice build!',
        date: Date.UTC(2026, 10, 1),
      },
    ],
    weapons: ['Rivers of Blood', null, null, 'Uchigatana', null, null],
    weaponAffinities: [null, null, null, 'Blood', null, null],
    weaponSkills: [null, null, null, 'Seppuku', null, null],
    arrows: [null, null, null, null],
    cons: [],
    tals: [
      "Lord of Blood's Exultation",
      'Rotten Winged Sword Insignia',
      "Millicent's Prosthesis",
      'Shard of Alexander',
    ],
    spells: [],
    tears: ['Opaline Hardtear', 'Crimson Crystal Tear'],
    ...stats(50, 15, 25, 18, 40, 9, 8, 45),
    helm: 'White Mask',
    chest: 'Raging Wolf Armor',
    gauntlet: 'Raging Wolf Gauntlets',
    leg: 'Raging Wolf Greaves',
  },
  {
    id: 'SEEDMOON0001',
    user: 'seed-ranni',
    name: 'Carian Moon Knight',
    description: 'Moonveil and full-moon sorceries. Quality-of-life INT build.',
    tags: ['Rennala', 'Rykard'],
    likes: 0,
    comments: [],
    weapons: ['Moonveil', null, null, 'Carian Regal Scepter', null, null],
    weaponAffinities: [null, null, null, null, null, null],
    weaponSkills: [null, null, null, null, null, null],
    arrows: [null, null, null, null],
    cons: [],
    tals: [
      'Graven-Mass Talisman',
      'Magic Scorpion Charm',
      "Radagon's Soreseal",
      'Moon of Nokstella',
    ],
    spells: ["Rennala's Full Moon", 'Comet Azur', 'Rock Sling', 'Glintstone Pebble'],
    tears: ['Cerulean Hidden Tear', 'Stonebarb Cracked Tear'],
    ...stats(40, 30, 15, 12, 18, 80, 7, 9),
    helm: "Lusat's Glintstone Crown",
    chest: "Lusat's Robe",
    gauntlet: "Lusat's Manchettes",
    leg: "Old Sorcerer's Legwraps",
  },
  {
    id: 'SEEDFAITH001',
    user: 'seed-ranni',
    name: 'Blasphemous Paladin',
    description: 'Strength/faith hybrid with the Blasphemous Blade and buffs.',
    tags: ['Godrick'],
    likes: 0,
    comments: [],
    weapons: ['Blasphemous Blade', null, null, 'Brass Shield', null, null],
    weaponAffinities: [null, null, null, null, null, null],
    weaponSkills: [null, null, null, null, null, null],
    arrows: [null, null, null, null],
    cons: [],
    tals: ["Erdtree's Favor +2", 'Godfrey Icon', 'Flamedrake Talisman +2', 'Shard of Alexander'],
    spells: ['Golden Vow', 'Flame Grant me Strength', 'Erdtree Heal'],
    tears: ['Opaline Hardtear', 'Greenburst Crystal Tear'],
    ...stats(45, 20, 25, 30, 12, 9, 60, 9),
    helm: null,
    chest: null,
    gauntlet: null,
    leg: null,
  },
  {
    id: 'SEEDNAKED001',
    user: 'seed-tarnished',
    name: 'Wretch Speedrun',
    description: '',
    tags: [],
    likes: 0,
    comments: [],
    weapons: ['Club', null, null, null, null, null],
    weaponAffinities: [null, null, null, null, null, null],
    weaponSkills: [null, null, null, null, null, null],
    arrows: [null, null, null, null],
    cons: [],
    tals: [],
    spells: [],
    tears: [],
    ...stats(10, 10, 10, 10, 10, 10, 10, 10),
    helm: null,
    chest: null,
    gauntlet: null,
    leg: null,
  },
];

// Seed data must only reference items that exist, or the editor silently drops them.
function validate(build) {
  const problems = [];
  const check = (ok, what) => ok || problems.push(what);
  build.weapons.forEach((n) => n && check(weapons[n], `weapon "${n}"`));
  build.weaponAffinities.forEach((n) => n && check(affinities.includes(n), `affinity "${n}"`));
  build.weaponSkills.forEach((n) => n && check(skills[n], `skill "${n}"`));
  build.tals.forEach((n) => check(talismans.has(n), `talisman "${n}"`));
  build.spells.forEach((n) => check(spells.has(n), `spell "${n}"`));
  build.tears.forEach((n) => check(tears.has(n), `tear "${n}"`));
  for (const [slot, group] of [
    ['helm', 'helms'],
    ['chest', 'chests'],
    ['gauntlet', 'gauntlets'],
    ['leg', 'legs'],
  ]) {
    if (build[slot]) check(armor[group][build[slot]], `${slot} "${build[slot]}"`);
  }
  if (problems.length)
    throw new Error(`Seed build ${build.id} references unknown ${problems.join(', ')}`);
}

const level = (b) =>
  String(Math.max(b.vigor + b.mind + b.end + b.str + b.dex + b.int + b.fai + b.arc - 79, 1));

async function main() {
  BUILDS.forEach(validate);
  initializeApp({ projectId: PROJECT_ID });
  const auth = getAuth();
  const db = getFirestore();

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
    await db.doc(`users/${user.uid}`).set({
      admin: false,
      email: user.email,
      name: user.name,
      builds: BUILDS.filter((b) => b.user === user.uid).map((b) => b.id),
      likedBuilds: user.uid === 'seed-ranni' ? ['SEEDBLEED001'] : [],
    });
  }

  for (const { id, ...build } of BUILDS) {
    await db.doc(`builds/${id}`).set({ ...build, level: level(build) });
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
