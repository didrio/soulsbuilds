// Writes design/mockup/data-editor.js: starting classes, stat curves and the sample item lists for the editor and picker.
// Run: node design/mockup/scripts/editor-data.cjs
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const R = ROOT + '/src/data/er/';
const fs = require('fs');
const load = (f) => {
  const d = require(R + f + '.json');
  return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const D = {
  weapons: load('weapons'),
  armor: load('armor'),
  talismans: load('talismans'),
  spells: load('spells'),
  tears: load('tears'),
  consumables: load('consumables'),
  greatRunes: load('greatRunes'),
  spiritAshes: load('spiritAshes'),
  arrows: load('arrows'),
  ashesOfWar: load('ashesOfWar'),
};
const skills = Object.fromEntries(load('skills').map((s) => [s.id, s]));
const wtypes = Object.fromEntries(load('weaponTypes').map((s) => [s.id, s.name]));
const acq = require(R + 'acquisition.json');
const loc = Object.fromEntries(acq.locations.map((l) => [l.id, l.name]));
const reg = Object.fromEntries(acq.regions.map((r) => [r.id, r.name]));
const ch = require(R + 'character.json');
const missing = [];
function where(file, it) {
  const src = (acq.items[file] || {})[it.id] || [];
  const s = src.find((x) => x.location || x.region) || src[0];
  if (!s) return null;
  let how = s.detail || '';
  if (s.kind === 'shop') how = `Sold by ${s.detail}`;
  else if (s.kind === 'boss') how = `Defeat ${s.detail}`;
  else if (s.kind === 'enemy') how = `Dropped by ${s.detail}`;
  else if (s.kind === 'pickup' && !how) how = 'Lies on the ground here';
  return { place: loc[s.location] || null, region: reg[s.region] || null, how };
}
const SIG = {
  'Rivers of Blood': 'blood',
  "Bloodhound's Fang": 'blood',
  Reduvia: 'blood',
  Moonveil: 'magic',
  'Dark Moon Greatsword': 'frost',
  'Sword of Night and Flame': 'magic',
  'Blasphemous Blade': 'fire',
  'Bolt of Gransax': 'lightning',
  "Rellana's Twin Blades": 'magic',
  'Wing of Astel': 'magic',
  Uchigatana: 'blood',
  Nagakiba: 'blood',
};
function item(file, name) {
  const it = D[file].find((x) => x.name === name);
  if (!it) {
    missing.push(file + ':' + name);
    return null;
  }
  const o = { n: it.name, i: it.icon };
  if (it.weight != null) o.w = it.weight;
  if (it.effect) o.fx = it.effect;
  if (it.poise != null) o.poise = it.poise;
  if (file === 'spells') {
    o.k = it.kind[0].toUpperCase() + it.kind.slice(1);
    o.mem = it.slots;
    o.fp = it.fp;
    o.req = Object.entries(it.requirements).filter(([, v]) => v > 0);
  }
  if (file === 'weapons') {
    o.k = wtypes[it.type] || 'Weapon';
    o.type = it.type;
    o.req = Object.entries(it.requirements).filter(([, v]) => v > 0);
    o.affs = it.affinities;
    o.aow = it.ashesOfWar;
    o.sig = SIG[it.name] || null;
    const sk = skills[it.skill];
    if (sk && sk.name !== 'No Skill') o.skill = { n: sk.name, fp: sk.fp, uniq: !it.ashesOfWar };
  }
  if (file === 'armor')
    o.k =
      {
        head: 'Head',
        body: 'Chest',
        arm: 'Arms',
        leg: 'Legs',
        arms: 'Arms',
        legs: 'Legs',
        chest: 'Chest',
      }[it.slot] || it.slot;
  if (file === 'talismans') o.k = 'Talisman';
  if (file === 'tears') o.k = 'Crystal tear';
  if (file === 'greatRunes') o.k = 'Great Rune';
  if (file === 'spiritAshes') {
    o.k = 'Spirit ash';
    o.fp = it.fp;
  }
  if (file === 'consumables') o.k = 'Item';
  if (file === 'arrows') o.k = /Bolt/.test(it.name) ? 'Bolt' : 'Arrow';
  o.where = where(file, it);
  return o;
}
const L = (file, names) => names.map((n) => item(file, n)).filter(Boolean);
const armorBy = (slot, sets) =>
  D.armor
    .filter((a) => sets.some((s) => a.name.startsWith(s)) && a.slot === slot)
    .slice(0, 14)
    .map((a) => item('armor', a.name));
const SETS = [
  'Raging Wolf',
  'Banished Knight',
  "Night's Cavalry",
  'Carian Knight',
  'Bull-Goat',
  'Black Knife',
  'Radahn',
  "Lionel's",
  'Vagabond Knight',
  'Alberich',
  'Blaidd',
  'Twinned',
  'Fire Prelate',
  'Godrick Knight',
];
const out = {
  classes: ch.classes.map((c) => ({ n: c.name, level: c.level, stats: c.stats })),
  curves: ch.curves,
  lists: {
    weapon: L('weapons', [
      'Rivers of Blood',
      'Uchigatana',
      'Nagakiba',
      'Moonveil',
      "Bloodhound's Fang",
      'Reduvia',
      'Longsword',
      "Lordsworn's Straight Sword",
      "Lordsworn's Greatsword",
      'Claymore',
      'Zweihander',
      'Greatsword',
      'Giant-Crusher',
      'Blasphemous Blade',
      'Dark Moon Greatsword',
      'Sword of Night and Flame',
      'Milady',
      "Rellana's Twin Blades",
      'Bolt of Gransax',
      'Wing of Astel',
      'Sacrificial Axe',
      'Club',
      'Meteorite Staff',
      'Carian Glintstone Staff',
      'Finger Seal',
      'Erdtree Seal',
      'Dragon Communion Seal',
      'Brass Shield',
      "Carian Knight's Shield",
      'Shortbow',
    ]),
    head: armorBy('head', SETS.concat(['White Mask', 'Okina Mask'])),
    chest: armorBy('chest', SETS),
    arms: armorBy('arms', SETS),
    legs: armorBy('legs', SETS),
    talisman: L('talismans', [
      "Lord of Blood's Exultation",
      'Rotten Winged Sword Insignia',
      'Winged Sword Insignia',
      'Shard of Alexander',
      'Carian Filigreed Crest',
      "Erdtree's Favor",
      'Green Turtle Talisman',
      "Great-Jar's Arsenal",
      'Claw Talisman',
      'Dragoncrest Greatshield Talisman',
      'Magic Scorpion Charm',
      'Fire Scorpion Charm',
      'Godfrey Icon',
      "Radagon's Soreseal",
      "Marika's Soreseal",
      'Moon of Nokstella',
      'Graven-Mass Talisman',
      "Assassin's Crimson Dagger",
      "Assassin's Cerulean Dagger",
      'Two Fingers Heirloom',
    ]),
    spell: L('spells', [
      'Flame, Grant Me Strength',
      'Golden Vow',
      'Bloodflame Blade',
      'Bloodboon',
      'Swarm of Flies',
      'Rotten Breath',
      'Dragonfire',
      "Greyoll's Roar",
      'Black Flame',
      'Lightning Spear',
      'Comet Azur',
      'Glintstone Pebble',
      'Rock Sling',
      'Carian Slicer',
      'Glintblade Phalanx',
      'Terra Magica',
      "Rennala's Full Moon",
      'Night Comet',
    ]),
    tear: L('tears', [
      'Crimson Crystal Tear',
      'Cerulean Crystal Tear',
      'Opaline Hardtear',
      'Magic-Shrouding Cracked Tear',
      'Thorny Cracked Tear',
      'Strength-knot Crystal Tear',
      'Dexterity-knot Crystal Tear',
      'Cerulean Hidden Tear',
    ]),
    rune: L(
      'greatRunes',
      D.greatRunes.map((g) => g.name),
    ),
    ash: L('spiritAshes', [
      'Mimic Tear Ashes',
      'Black Knife Tiche',
      'Lhutel the Headless',
      'Dung Eater Puppet',
      'Ancient Dragon Knight Kristoff',
      'Latenna the Albinauric',
      'Jellyfish Ashes',
      'Lone Wolf Ashes',
    ]),
    item: L('consumables', [
      'Starlight Shards',
      'Boiled Crab',
      'Rune Arc',
      'Exalted Flesh',
      'Magic Grease',
      'Blood Grease',
      'Throwing Dagger',
      'Pickled Turtle Neck',
      'Warming Stone',
      'Golden Rune [12]',
    ]),
    ammo: L('arrows', [
      'Arrow',
      'Serpent Arrow',
      'Fire Arrow',
      'Bolt',
      'Lightning Bolt',
      'Perfumer Bolt',
    ]),
  },
  ashes: D.ashesOfWar
    .filter((a) =>
      [
        'Bloody Slash',
        'Seppuku',
        "Lion's Claw",
        'Golden Vow',
        'Glintblade Phalanx',
        'Hoarfrost Stomp',
        'Flaming Strike',
        'Lightning Slash',
        'Sacred Blade',
        'Spinning Slash',
        'Wild Strikes',
        'Unsheathe',
        'Determination',
        'Carian Grandeur',
        'Square Off',
        'Storm Stomp',
        'Chilling Mist',
        'Barrage',
        'Carian Retaliation',
        'Parry',
      ].includes(a.name.replace('Ash of War: ', '')),
    )
    .map((a) => ({
      n: a.name,
      i: a.icon,
      k: 'Ash of War',
      skill: a.name.replace('Ash of War: ', ''),
      fp: skills[a.skill]?.fp,
      types: a.weaponTypes,
      affs: a.affinities,
      where: where('ashesOfWar', a),
    })),
};
fs.writeFileSync(
  process.argv[2] || path.join(__dirname, '../data-editor.js'),
  '/* Editor mock-up data: classes, stat curves and sample item lists from the game data (the real picker lists every item). */\nwindow.ED=' +
    JSON.stringify(out) +
    ';\n',
);
console.log('missing', missing);
const ids = new Set();
JSON.stringify(out, (k, v) => {
  if (k === 'i') ids.add(v);
  return v;
});
if (process.argv[3]) fs.writeFileSync(process.argv[3], [...ids].join('\n'));
for (const [k, l] of Object.entries(out.lists)) console.log(k, l.length);
console.log('ashes', out.ashes.length, 'icons', ids.size);
