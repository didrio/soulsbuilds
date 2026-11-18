// Writes design/mockup/data-loadouts.js: the three test builds' gear, stats, vitals and guide routes, from the game data.
// Run: node design/mockup/scripts/loadouts.cjs
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
const regOrd = Object.fromEntries(acq.regions.map((r) => [r.id, r.order]));
const locOrd = Object.fromEntries(acq.locations.map((l) => [l.id, l.order]));
const missing = [];
const KIND_HOW = {
  pickup: 'Pick it up',
  shop: 'Buy it',
  boss: 'Defeat',
  enemy: 'Dropped by',
  quest: 'Quest',
  alteration: 'Alter',
  reward: 'Reward',
};
function where(file, it) {
  const src = (acq.items[file] || {})[it.id] || [];
  const s = src.find((x) => x.location || x.region) || src[0];
  if (!s) return null;
  let how = s.detail || '';
  if (s.kind === 'shop')
    how = `Sold by ${s.detail}${s.cost ? ` for ${s.cost.amount.toLocaleString('en-US')} ${s.cost.currency}` : ''}`;
  else if (s.kind === 'boss') how = `Defeat ${s.detail}`;
  else if (s.kind === 'enemy') how = `Dropped by ${s.detail}`;
  else if (s.kind === 'pickup' && !how) how = 'Lies on the ground here';
  return {
    place: loc[s.location] || null,
    region: reg[s.region] || null,
    how,
    ord: (regOrd[s.region] ?? 99) * 1000 + (locOrd[s.location] ?? 0),
  };
}
function item(file, name, extra = {}) {
  const it = D[file].find((x) => x.name === name);
  if (!it) {
    missing.push(file + ':' + name);
    return null;
  }
  const o = { n: it.name, i: it.icon, file };
  if (it.weight != null) o.w = it.weight;
  if (it.effect) o.fx = it.effect;
  if (it.poise != null) o.poise = it.poise;
  if (it.slots != null) o.mem = it.slots;
  if (it.fp != null && file === 'spiritAshes') o.fp = it.fp;
  if (it.kind) o.k = it.kind[0].toUpperCase() + it.kind.slice(1);
  if (file === 'weapons') {
    o.k = wtypes[it.type] || 'Weapon';
    o.inf = (it.affinities || []).length > 1;
    const r = it.requirements;
    o.req = Object.entries(r)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => [k, v]);
    // every armament with a skill gets a skill badge: the Ash of War applied (or the one it comes with), or its unique skill
    const ashItem = (a, def) => ({
      n: a.name,
      i: a.icon,
      k: def ? 'Ash of War · comes with the weapon' : 'Ash of War',
      file: 'ashesOfWar',
      skill: a.name.replace('Ash of War: ', ''),
      fp: skills[a.skill]?.fp,
      affs: a.affinities,
      where: where('ashesOfWar', a),
    });
    if (extra.ash) {
      const a = D.ashesOfWar.find((x) => x.name === 'Ash of War: ' + extra.ash);
      if (!a) missing.push('ash:' + extra.ash);
      else {
        o.ash = ashItem(a, false);
        o.skill = extra.ash;
      }
    } else {
      const sk = skills[it.skill];
      o.skill = sk?.name;
      if (sk && sk.name !== 'No Skill') {
        const a = it.ashesOfWar ? D.ashesOfWar.find((x) => x.skill === it.skill) : null;
        o.ash = a
          ? ashItem(a, true)
          : {
              n: sk.name,
              k: 'Unique skill · ' + it.name,
              file: 'uskill',
              skill: sk.name,
              fp: sk.fp,
              uniq: true,
            };
      }
    }
    if (o.skill === 'No Skill') delete o.skill;
    if (extra.aff) o.aff = extra.aff;
  }
  if (file === 'spells' && it.requirements)
    o.req = Object.entries(it.requirements).filter(([, v]) => v > 0);
  if (file === 'armor')
    o.k = { head: 'Head', body: 'Chest', arm: 'Arms', leg: 'Legs' }[it.slot] || it.slot;
  if (file === 'talismans') o.k = 'Talisman';
  if (file === 'tears') o.k = 'Crystal tear';
  if (file === 'greatRunes') o.k = 'Great Rune';
  if (file === 'spiritAshes') o.k = 'Spirit ash';
  if (file === 'consumables') o.k = 'Item';
  if (file === 'arrows') o.k = /Bolt/.test(it.name) ? 'Bolt' : 'Arrow';
  o.where = where(file, it);
  return o;
}
const W = (n, x) => item('weapons', n, x);
const build = (b) => ({
  name: b.name,
  level: b.level,
  cls: b.cls,
  stats: b.stats,
  key: b.key || [],
  right: [0, 1, 2].map((i) => (b.right[i] ? W(...[].concat(b.right[i])) : null)),
  left: [0, 1, 2].map((i) => (b.left[i] ? W(...[].concat(b.left[i])) : null)),
  ammo: [0, 1, 2, 3].map((i) => (b.ammo?.[i] ? item('arrows', b.ammo[i]) : null)),
  armor: ['helm', 'chest', 'gauntlet', 'leg'].map((k) =>
    b.armor[k] ? item('armor', b.armor[k]) : null,
  ),
  talismans: (b.talismans || []).map((n) => item('talismans', n)),
  spells: (b.spells || []).map((n) => item('spells', n)),
  memory: b.memory || 10,
  tears: (b.tears || []).map((n) => item('tears', n)),
  items: (b.items || []).map((n) => item('consumables', n)),
  greatRune: b.greatRune ? item('greatRunes', b.greatRune) : null,
  spiritAsh: b.spiritAsh ? item('spiritAshes', b.spiritAsh) : null,
});
const full = build({
  name: 'Night and Flame Spellblade',
  level: 150,
  cls: 'Astrologer',
  stats: { vigor: 50, mind: 25, end: 30, str: 12, dex: 12, int: 66, fai: 25, arc: 9 },
  key: ['Sword of Night and Flame', 'Comet Azur', 'Shard of Alexander'],
  right: [
    'Sword of Night and Flame',
    'Carian Regal Scepter',
    ["Lordsworn's Straight Sword", { aff: 'Magic', ash: 'Glintblade Phalanx' }],
  ],
  left: [
    ["Carian Knight's Shield", { ash: 'Carian Retaliation' }],
    'Frenzied Flame Seal',
    ['Shortbow', {}],
  ],
  ammo: ['Arrow', 'Serpent Arrow', 'Bolt', 'Lightning Bolt'],
  armor: {
    helm: "Night's Cavalry Helm",
    chest: "Night's Cavalry Armor",
    gauntlet: "Lionel's Gauntlets",
    leg: "Lionel's Greaves",
  },
  talismans: [
    'Magic Scorpion Charm',
    'Moon of Nokstella',
    "Assassin's Cerulean Dagger",
    'Shard of Alexander',
  ],
  spells: [
    'Comet Azur',
    'Rancorcall',
    'Golden Vow',
    'Terra Magica',
    'Glintstone Pebble',
    'Rock Sling',
    'Carian Slicer',
    'Glintblade Phalanx',
    'Carian Greatsword',
    'Flame, Grant Me Strength',
  ],
  memory: 12,
  tears: ['Cerulean Hidden Tear', 'Magic-Shrouding Cracked Tear'],
  items: [
    'Starlight Shards',
    'Boiled Crab',
    'Rune Arc',
    'Exalted Flesh',
    'Magic Grease',
    'Throwing Dagger',
    'Glintstone Scrap',
    'Pickled Turtle Neck',
    'Warming Stone',
    'Golden Rune [12]',
  ],
  greatRune: "Radahn's Great Rune",
  spiritAsh: 'Black Knife Tiche',
});
const half = build({
  name: 'Rivers of Blood Bleed Samurai',
  level: 150,
  cls: 'Samurai',
  stats: { vigor: 58, mind: 30, end: 18, str: 16, dex: 38, int: 9, fai: 15, arc: 45 },
  key: ['Rivers of Blood', "Lord of Blood's Exultation", 'Flame, Grant Me Strength'],
  right: ['Rivers of Blood'],
  left: ['Sacrificial Axe', 'Dragon Communion Seal'],
  armor: {
    helm: 'White Mask',
    chest: 'Raging Wolf Armor',
    gauntlet: 'Raging Wolf Gauntlets',
    leg: 'Raging Wolf Greaves',
  },
  talismans: [
    "Lord of Blood's Exultation",
    'Rotten Winged Sword Insignia',
    'Carian Filigreed Crest',
    'Shard of Alexander',
  ],
  spells: [
    'Flame, Grant Me Strength',
    'Bloodflame Blade',
    'Bloodboon',
    'Rotten Breath',
    'Swarm of Flies',
    "Greyoll's Roar",
  ],
  memory: 10,
});
const sparse = build({
  name: "Lordsworn's Greatsword Starter",
  level: 50,
  cls: null,
  key: ["Lordsworn's Greatsword"],
  stats: { vigor: 26, mind: 10, end: 30, str: 25, dex: 13, int: 9, fai: 9, arc: 7 },
  right: [["Lordsworn's Greatsword", { aff: 'Heavy', ash: 'Golden Vow' }]],
  left: [],
  armor: { helm: 'Banished Knight Helm', chest: 'Banished Knight Armor' },
  talismans: [],
  spells: [],
  memory: 10,
});
const C = require(R + 'character.json').curves;
function curve({ stages, values, exponents }, x) {
  for (let i = stages.length - 2; i >= 0; i--)
    if (x >= stages[i]) {
      const t = (x - stages[i]) / (stages[i + 1] - stages[i]),
        e = exponents[i];
      const r = e > 0 ? Math.pow(t, e) : 1 - Math.pow(1 - t, -e);
      return values[i] + (values[i + 1] - values[i]) * r;
    }
  return values[0];
}
for (const b of [full, half, sparse]) {
  const st = b.stats,
    g = [...b.right, ...b.left, ...b.armor, ...b.talismans].filter(Boolean);
  const weight = Math.round(g.reduce((s, x) => s + (x.w || 0), 0) * 10) / 10;
  const load = Math.round(curve(C.equipLoad, st.end) * 10) / 10;
  const pct = weight / load;
  b.vit = {
    hp: Math.floor(curve(C.hp, st.vigor)),
    fp: Math.floor(curve(C.fp, st.mind)),
    stamina: Math.floor(curve(C.stamina, st.end)),
    poise: b.armor.filter(Boolean).reduce((s, x) => s + x.poise, 0),
    weight,
    load,
    roll: pct <= 0.3 ? 'Light' : pct <= 0.7 ? 'Medium' : pct <= 1 ? 'Heavy' : 'Overloaded',
  };
}
for (const b of [full, half, sparse]) {
  const got = [
    ...b.right,
    ...b.left,
    ...[...b.right, ...b.left].map((w) =>
      w && w.ash && !w.ash.uniq && !/comes with/.test(w.ash.k) ? w.ash : null,
    ),
    ...b.ammo,
    ...b.armor,
    ...b.talismans,
    ...b.spells,
    ...b.tears,
    ...b.items,
    b.greatRune,
    b.spiritAsh,
  ].filter((x) => x && x.where);
  const stops = new Map();
  for (const it of got) {
    const k = (it.where.place || '') + '|' + (it.where.region || '');
    if (!stops.has(k))
      stops.set(k, {
        region: it.where.region || 'Anywhere',
        place: it.where.place || it.where.region || 'Anywhere',
        how: it.where.how,
        ord: it.where.ord,
        items: [],
      });
    stops.get(k).items.push(it.n);
  }
  b.route = [...stops.values()].sort((x, y) => x.ord - y.ord).map(({ ord, ...st }) => st);
}
const out = { full, half, sparse };
fs.writeFileSync(
  process.argv[2] || path.join(__dirname, '../data-loadouts.js'),
  '/* Test loadouts for the equipment pane: real items and data; "full" is a stress test, not a seeded build. */\nwindow.LOADOUTS=' +
    JSON.stringify(out) +
    ';\n',
);
console.log('missing', missing);
for (const [k, b] of Object.entries(out))
  console.log(
    k,
    'spells mem',
    b.spells.reduce((s, x) => s + (x?.mem || 0), 0),
    '/',
    b.memory,
    'noWhere',
    [...b.right, ...b.left, ...b.armor, ...b.talismans, ...b.spells, ...b.items, ...b.tears]
      .filter((x) => x && !x.where)
      .map((x) => x.n)
      .join(','),
  );
console.log(JSON.stringify(full.right[2]), JSON.stringify(sparse.right));
