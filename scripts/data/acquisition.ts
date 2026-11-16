// Acquisition data (T14): where every pickable item comes from, as src/data/er/acquisition.json. Pure
// (no file access) like extract.ts, so the fixture tests cover it; the hand-written facts come in as
// `inputs` (scripts/data/{progression,places,events}.ts in the real build).
//
// The export has no map positions (no MSB files), so sources are placed through their IDs:
// - open-world item lots `1 0XX ZZ nnnn` (m60_XX_ZZ; `2…` = m61, the DLC) → the nearest Site of Grace;
// - dungeon item lots `AABB nnnn` (mAA_BB) → the dungeon's entrance grace (lowest travel-menu sort), or,
//   for a dungeon with none, its overworld spot (WorldMapLegacyConvParam) → the nearest grace;
// - event lots (ID < 10^7: bosses, NPC rewards, scarabs…) → the community row name as a hint
//   (`[Place - Boss]`), or the hand-written EVENTS table;
// - shops by lineup ID range (places.ts SHOPS), recipes by their cookbook (the release flag is the
//   cookbook's own lot/shop flag), starting classes from CharaInitParam, enemies via places.ts ENEMIES.
// docs/data.md "Acquisition" explains the limits (a big dungeon's items all show at its entrance).
import type {
  Acquisition,
  AcquisitionFile,
  Gate,
  Location,
  Region,
  Source,
  SourceKind,
} from '../../src/data/schema.ts';
import { ACQUISITION_FILES, SOURCE_KINDS } from '../../src/data/schema.ts';
import { num, type Param, type Row, type TextIndex } from './export.ts';
import type { GameData } from './extract.ts';

/** Params read for acquisition, on top of extract.ts's PARAM_NAMES (EquipParamGoods comes from there). */
export const ACQUISITION_PARAMS = [
  'ItemLotParam_map',
  'ItemLotParam_enemy',
  'ShopLineupParam',
  'ShopLineupParam_Recipe',
  'EquipMtrlSetParam',
  'BonfireWarpParam',
  'BonfireWarpSubCategoryParam',
  'WorldMapLegacyConvParam',
  'CharaInitParam',
  'EquipParamCustomWeapon',
] as const;
export type AcquisitionParamName = (typeof ACQUISITION_PARAMS)[number];

/** The ten starting classes (Vagabond … Wretch). 3010+ are unused. */
const CLASS_ROWS = { from: 3000, to: 3009 };

// --- Hand-written inputs -------------------------------------------------------------------------

/**
 * A place in the hand-written tables: a grace ID, a unique grace name (`'Church of Elleh'`), a grace
 * name within a region (`'Elden Throne@Leyndell, Royal Capital'`), or a whole region
 * (`'region:Liurnia of the Lakes'`). Names are the game's own text.
 */
export type PlaceRef = number | string;

/** An item named in a table: `'<file>:<name>'`, file being a data file or `goods` (any goods). */
export type ItemName = string;

export interface SourceInput {
  kind: SourceKind;
  /** null = anywhere / no single place (e.g. a quest that moves around). */
  at: PlaceRef | null;
  detail: string;
  requires?: string[];
  needs?: ItemName;
}

export interface GateInput {
  id: string;
  label: string;
  requires?: string[];
  at?: PlaceRef;
  /** A key item's goods name, e.g. 'Spirit Calling Bell'. */
  item?: string;
  anyOf?: { count: number; gates: string[] };
}

export interface ShopRange {
  from: number;
  to: number;
  /** `ignore`: not a way to get an item (Reversion, Ash of War duplication, unused lineups). */
  kind: 'shop' | 'remembrance' | 'alteration' | 'ignore';
  merchant?: string;
  at?: PlaceRef | null;
  requires?: string[];
  /** Sold only after you have this (a boss's drop for Enia's armor, a scroll for Sellen…). */
  needs?: ItemName;
}

export interface AcquisitionInputs {
  /** Every region (travel-menu name) in canonical route order, with the gates it needs. */
  regions: { name: string; requires: string[] }[];
  /** Extra gates for single graces (e.g. Moonlight Altar inside Liurnia). */
  locationRequires: [PlaceRef, string[]][];
  gates: GateInput[];
  implied: Acquisition['implied'];
  shops: ShopRange[];
  /** Place names as the row-name hints write them → the place ('Liurnia' → the region). */
  aliases: Record<string, PlaceRef>;
  /** Event lots the hint can't place: by lot ID (`'20661'`) or by hint label (`'Knight Bernahl'`). */
  events: Record<string, SourceInput>;
  /** Enemy type (the enemy lot's hint label) → where to farm it; a lot ID wins over the type. */
  enemies: Record<string, { at: PlaceRef; note?: string }>;
  /** Sources the params don't have (quest rewards, keepsakes), by `'<file>:<name>'`. */
  extraSources: Record<ItemName, SourceInput[]>;
  /** Items no one can get in a normal game (multiplayer tools…): `'<file>:<name>'` → why. */
  noSource: Record<ItemName, string>;
  /** Items whose hand-written facts aren't written yet (T19); allowed without a placed source. */
  pending: ItemName[];
}

export interface AcquisitionResult {
  acquisition: Acquisition;
  problems: string[];
  notes: string[];
}

// --- Helpers -------------------------------------------------------------------------------------

const TILE = 256;
/**
 * Lot categories (ITEMLOT_ITEMCATEGORY) and shop equip types (SHOP_LINEUP_EQUIPTYPE). `custom` is a weapon
 * with an Ash of War already on it (EquipParamCustomWeapon: Edgar's halberd, the DLC's new weapon types); it
 * gives both, since the ash can be taken off.
 */
const LOT_CATEGORY: Record<number, LotCategory> = {
  1: 'goods',
  2: 'weapon',
  3: 'protector',
  4: 'accessory',
  5: 'gem',
  6: 'custom',
};
const SHOP_CATEGORY: Record<number, LotCategory> = {
  0: 'weapon',
  1: 'protector',
  2: 'accessory',
  3: 'goods',
  4: 'gem',
  5: 'custom',
};
/** EquipMtrlSetParam materialCate. */
const MATERIAL_CATEGORY: Record<number, Category> = {
  0: 'weapon',
  1: 'protector',
  2: 'accessory',
  4: 'goods',
};
type Category = 'weapon' | 'protector' | 'accessory' | 'goods' | 'gem';
type LotCategory = Category | 'custom';

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const isDlcArea = (area: number) => area === 61 || (area >= 20 && area <= 28);
const label = (row: Row) => row.Name?.match(/^\[([^\]]+)\]/)?.[1];

interface Grace {
  id: number;
  name: string;
  region: number;
  area: number;
  block: number;
  sort: number;
  x: number;
  z: number;
}

export function extractAcquisition({
  params,
  text,
  data,
  inputs,
}: {
  params: Record<AcquisitionParamName | 'EquipParamGoods', Param>;
  text: TextIndex;
  data: GameData;
  inputs: AcquisitionInputs;
}): AcquisitionResult {
  const problems: string[] = [];
  const notes: string[] = [];
  const placeText = text.get('PlaceName') ?? new Map();
  const menuText = text.get('GR_MenuText') ?? new Map();
  const goodsText = text.get('GoodsName') ?? new Map();

  // --- Items: what a param ID means in our files ---------------------------------------------
  const fileOf = new Map<string, AcquisitionFile>();
  const nameOf = new Map<string, string>();
  const byName = new Map<string, number>(); // `<file>:<name>` → id
  const prefix: Record<Exclude<AcquisitionFile, 'keyItems'>, Category> = {
    weapons: 'weapon',
    arrows: 'weapon',
    armor: 'protector',
    talismans: 'accessory',
    ashesOfWar: 'gem',
    spells: 'goods',
    tears: 'goods',
    consumables: 'goods',
    greatRunes: 'goods',
    spiritAshes: 'goods',
  };
  for (const [file, category] of Object.entries(prefix) as [
    Exclude<AcquisitionFile, 'keyItems'>,
    Category,
  ][]) {
    for (const item of data[file] as { id: number; name: string }[]) {
      fileOf.set(`${category}:${item.id}`, file);
      nameOf.set(`${file}:${item.id}`, item.name);
      byName.set(`${file}:${item.name}`, item.id);
      if (category === 'goods') byName.set(`goods:${item.name}`, item.id);
    }
  }
  // Goods by name, for upgrade copies (spirit ash +1… share the base item) and key items.
  const goodsIdsByName = new Map<string, number[]>();
  for (const [id] of params.EquipParamGoods) {
    const entry = goodsText.get(id);
    if (!entry) continue;
    const base = entry.text.replace(/ \+ ?\d+$/, '');
    goodsIdsByName.set(base, [...(goodsIdsByName.get(base) ?? []), id]);
  }
  const keyItems = new Map<number, string>();
  const greatRuneNames = new Set(data.greatRunes.map((rune) => rune.name));
  const addKeyItem = (id: number) => {
    const name = goodsText.get(id)?.text;
    if (!name) return false;
    if (!fileOf.has(`goods:${id}`)) keyItems.set(id, name);
    return true;
  };
  /** Param category + ID → our file and item ID (weapon affinity/upgrade rows → the base weapon). */
  const resolveItem = (
    category: Category,
    rawId: number,
  ): { file: AcquisitionFile; id: number } | null => {
    const id = category === 'weapon' ? rawId - (rawId % 10000) : rawId;
    const file = fileOf.get(`${category}:${id}`);
    if (file) return { file, id };
    if (category !== 'goods') return null;
    if (keyItems.has(id)) return { file: 'keyItems', id };
    // A boss drops its Great Rune unrestored (a key item of the same name); the Divine Tower's
    // lot gives the restored one. Kept apart so the tower can need the boss's drop (below).
    const raw = goodsText.get(id)?.text;
    if (raw && greatRuneNames.has(raw)) {
      keyItems.set(id, `${raw} (unrestored)`);
      return { file: 'keyItems', id };
    }
    const name = raw?.replace(/ \+ ?\d+$/, '');
    const base = name === undefined ? undefined : byName.get(`goods:${name}`);
    if (base !== undefined) return { file: fileOf.get(`goods:${base}`)!, id: base };
    return null;
  };
  /** `'<file>:<name>'` from a table → item; goods names may be key items (registered on use). */
  const itemByName = (
    ref: ItemName,
    owner: string,
  ): { file: AcquisitionFile; id: number } | null => {
    const [file, ...rest] = ref.split(':');
    const name = rest.join(':');
    const id = byName.get(`${file}:${name}`);
    if (id !== undefined && file !== 'goods') return { file: file as AcquisitionFile, id };
    if (file === 'goods') {
      if (id !== undefined) return { file: fileOf.get(`goods:${id}`)!, id };
      const goodsId = goodsIdsByName.get(name)?.[0];
      if (goodsId !== undefined && addKeyItem(goodsId)) return { file: 'keyItems', id: goodsId };
    }
    problems.push(`${owner}: no item "${ref}"`);
    return null;
  };

  // --- Regions and graces --------------------------------------------------------------------
  const regionRows = new Map<number, string>();
  for (const [id, row] of params.BonfireWarpSubCategoryParam) {
    const name = menuText.get(num(row, 'textId'))?.text;
    if (name) regionRows.set(id, name);
  }
  const graces: Grace[] = [];
  for (const [id, row] of params.BonfireWarpParam) {
    const name = placeText.get(num(row, 'textId1'))?.text;
    const region = num(row, 'bonfireSubCategoryId');
    if (!id || !name || !regionRows.has(region)) continue;
    const area = num(row, 'areaNo');
    graces.push({
      id,
      name,
      region,
      area,
      block: num(row, 'gridXNo'),
      sort: num(row, 'bonfireSubCategorySortId'),
      x: num(row, 'gridXNo') * TILE + num(row, 'posX'),
      z: num(row, 'gridZNo') * TILE + num(row, 'posZ'),
    });
  }
  const usedRegions = new Set(graces.map((grace) => grace.region));
  const regionIdByName = new Map(
    [...regionRows].filter(([id]) => usedRegions.has(id)).map(([id, name]) => [name, id]),
  );
  const regions: Region[] = [];
  inputs.regions.forEach((input, index) => {
    const id = regionIdByName.get(input.name);
    if (id === undefined)
      return void problems.push(`progression: no region "${input.name}" in the game`);
    regions.push({
      id,
      name: input.name,
      dlc: graces.some((grace) => grace.region === id && isDlcArea(grace.area)),
      requires: input.requires,
      order: index + 1,
    });
  });
  for (const [name] of regionIdByName)
    if (!inputs.regions.some((region) => region.name === name))
      problems.push(`progression: region "${name}" has no place in the route order`);
  const regionById = new Map(regions.map((region) => [region.id, region]));

  const sortedGraces = graces
    .filter((grace) => regionById.has(grace.region))
    .sort(
      (a, b) =>
        regionById.get(a.region)!.order - regionById.get(b.region)!.order ||
        a.sort - b.sort ||
        a.id - b.id,
    );
  const locations: Location[] = sortedGraces.map((grace, index) => ({
    id: grace.id,
    name: grace.name,
    region: grace.region,
    requires: [...regionById.get(grace.region)!.requires],
    order: index + 1,
  }));
  const locationById = new Map(locations.map((location) => [location.id, location]));

  // --- Places --------------------------------------------------------------------------------
  type Placed = { location: number | null; region: number | null };
  const gracesByName = new Map<string, Grace[]>();
  for (const grace of sortedGraces) {
    const key = normalize(grace.name);
    gracesByName.set(key, [...(gracesByName.get(key) ?? []), grace]);
  }
  const regionByNormalName = new Map(regions.map((region) => [normalize(region.name), region.id]));
  const aliases = new Map(
    Object.entries(inputs.aliases).map(([name, ref]) => [normalize(name), ref]),
  );
  /** A hand-written PlaceRef → location/region; undefined (and a problem) if it doesn't resolve. */
  const resolveRef = (ref: PlaceRef, owner: string): Placed | undefined => {
    if (typeof ref === 'number') {
      const location = locationById.get(ref);
      if (location) return { location: ref, region: location.region };
    } else if (ref.startsWith('region:')) {
      const region = regionByNormalName.get(normalize(ref.slice(7)));
      if (region !== undefined) return { location: null, region };
    } else {
      const [name, regionName] = ref.split('@');
      const matches = (gracesByName.get(normalize(name ?? '')) ?? []).filter(
        (grace) =>
          regionName === undefined ||
          grace.region === regionByNormalName.get(normalize(regionName)),
      );
      if (matches.length === 1) return { location: matches[0]!.id, region: matches[0]!.region };
      if (matches.length > 1) {
        problems.push(
          `${owner}: "${ref}" names ${matches.length} graces; add @<region> or use the ID`,
        );
        return undefined;
      }
    }
    problems.push(`${owner}: no place "${ref}"`);
    return undefined;
  };
  /** A place name from a row-name hint (aliases first, then unique grace names, then regions). */
  const placeFromHint = (name: string): Placed | undefined => {
    const key = normalize(name);
    const alias = aliases.get(key);
    if (alias !== undefined) return resolveRef(alias, `alias "${name}"`);
    const matches = gracesByName.get(key);
    if (matches?.length === 1) return { location: matches[0]!.id, region: matches[0]!.region };
    const region = regionByNormalName.get(key);
    if (region !== undefined) return { location: null, region };
    return undefined;
  };
  /** A boss in a region-only place → its arena grace when one is named after it ("Godrick the Grafted"). */
  const bossGrace = (place: Placed, boss: string): Placed => {
    if (place.location !== null || place.region === null) return place;
    const matches = sortedGraces.filter(
      (grace) => grace.region === place.region && normalize(grace.name).startsWith(normalize(boss)),
    );
    return matches.length === 1 ? { location: matches[0]!.id, region: place.region } : place;
  };
  const nearestGrace = (area: number, x: number, z: number): Placed => {
    let best: Grace | undefined;
    let bestDistance = Infinity;
    for (const grace of sortedGraces) {
      if (grace.area !== area) continue;
      const distance = (grace.x - x) ** 2 + (grace.z - z) ** 2;
      if (distance < bestDistance || (distance === bestDistance && grace.id < best!.id)) {
        best = grace;
        bestDistance = distance;
      }
    }
    return best ? { location: best.id, region: best.region } : { location: null, region: null };
  };
  const legacyConv = new Map<string, Row>();
  for (const [, row] of params.WorldMapLegacyConvParam) {
    const key = `${num(row, 'srcAreaNo')}_${num(row, 'srcGridXNo')}`;
    if (num(row, 'dstAreaNo') === 60 || num(row, 'dstAreaNo') === 61)
      if (!legacyConv.has(key) || num(row, 'isBasePoint') === 1) legacyConv.set(key, row);
  }
  const dungeonCache = new Map<string, Placed>();
  /** Where an item lot is, from its ID (event lots: null, they're placed by their hint). */
  const placeLot = (id: number): Placed | null => {
    if (id >= 1e9) {
      const digits = String(id);
      const area = digits[0] === '1' ? 60 : 61;
      return nearestGrace(
        area,
        Number(digits.slice(2, 4)) * TILE,
        Number(digits.slice(4, 6)) * TILE,
      );
    }
    if (id >= 9e8) {
      // Moving objects (carriages): `9 XX ZZ nnnn` on m60_XX_ZZ; 99… rows are unused.
      const digits = String(id);
      const x = Number(digits.slice(1, 3));
      return x >= 30 && x < 70
        ? nearestGrace(60, x * TILE, Number(digits.slice(3, 5)) * TILE)
        : { location: null, region: null };
    }
    if (id < 1e7) return null;
    const area = Math.floor(id / 1e6);
    const block = Math.floor(id / 1e4) % 100;
    const key = `${area}_${block}`;
    if (!dungeonCache.has(key)) {
      const entrance = sortedGraces
        .filter((grace) => grace.area === area && grace.block === block)
        .sort((a, b) => a.sort - b.sort || a.id - b.id)[0];
      const conv = legacyConv.get(key);
      dungeonCache.set(
        key,
        entrance
          ? { location: entrance.id, region: entrance.region }
          : conv
            ? nearestGrace(
                num(conv, 'dstAreaNo'),
                num(conv, 'dstGridXNo') * TILE + num(conv, 'dstPosX'),
                num(conv, 'dstGridZNo') * TILE + num(conv, 'dstPosZ'),
              )
            : { location: null, region: null },
      );
    }
    return dungeonCache.get(key)!;
  };

  // --- Key items: gate items, cookbooks, remembrances, prerequisites --------------------------
  /** A lot/shop entry → the param rows it gives (a custom weapon: its base weapon and its Ash of War). */
  const expand = (category: LotCategory, id: number): { category: Category; id: number }[] => {
    if (category !== 'custom') return [{ category, id }];
    const row = params.EquipParamCustomWeapon.get(id);
    if (!row) return [];
    const gem = num(row, 'gemId');
    return [
      { category: 'weapon', id: num(row, 'baseWepId') },
      ...(gem > 0 ? [{ category: 'gem' as const, id: gem }] : []),
    ];
  };
  const lotEntries = (row: Row) => {
    const entries: { category: Category; id: number }[] = [];
    for (let i = 1; i <= 8; i += 1) {
      const category = LOT_CATEGORY[num(row, `lotItemCategory0${i}`)];
      const id = num(row, `lotItemId0${i}`);
      if (category && id > 0 && num(row, `lotItemBasePoint0${i}`) > 0)
        entries.push(...expand(category, id));
    }
    return entries;
  };
  const shopItems = (row: Row) =>
    expand(SHOP_CATEGORY[num(row, 'equipType')] ?? 'gem', num(row, 'equipId'))
      .map((entry) => resolveItem(entry.category, entry.id))
      .filter((item) => item !== null);
  // Flag → the goods a lot or a once-only shop row gives (how a recipe names its cookbook).
  const goodsByFlag = new Map<number, number>();
  for (const name of ['ItemLotParam_map', 'ItemLotParam_enemy'] as const)
    for (const [, row] of params[name]) {
      const goods = lotEntries(row).filter((entry) => entry.category === 'goods');
      const flag = num(row, 'getItemFlagId');
      if (goods.length === 1 && flag > 0 && !goodsByFlag.has(flag))
        goodsByFlag.set(flag, goods[0]!.id);
      for (let i = 1; i <= 8; i += 1) {
        const itemFlag = num(row, `getItemFlagId0${i}`);
        if (itemFlag > 0 && LOT_CATEGORY[num(row, `lotItemCategory0${i}`)] === 'goods')
          goodsByFlag.set(itemFlag, num(row, `lotItemId0${i}`));
      }
    }
  for (const [, row] of params.ShopLineupParam)
    if (SHOP_CATEGORY[num(row, 'equipType')] === 'goods' && num(row, 'eventFlag_forStock') > 0)
      if (!goodsByFlag.has(num(row, 'eventFlag_forStock')))
        goodsByFlag.set(num(row, 'eventFlag_forStock'), num(row, 'equipId'));

  const gateItems = new Map<string, { file: AcquisitionFile; id: number }>();
  for (const gate of inputs.gates)
    if (gate.item) {
      const item = itemByName(`goods:${gate.item}`, `gate ${gate.id}`);
      if (item) gateItems.set(gate.id, item);
    }
  const material = (mtrlId: number): { category: Category; id: number } | null => {
    const row = params.EquipMtrlSetParam.get(mtrlId);
    if (!row) return null;
    const category = MATERIAL_CATEGORY[num(row, 'materialCate01')];
    const id = num(row, 'materialId01');
    return category && id > 0 ? { category, id } : null;
  };
  // Items the tables name as prerequisites (scrolls, prayerbooks, a boss's drop) are registered before
  // the lots are read, so their own sources are collected too.
  for (const shop of inputs.shops) if (shop.needs) itemByName(shop.needs, `shop ${shop.from}`);
  for (const [key, event] of Object.entries(inputs.events))
    if (event.needs) itemByName(event.needs, `event ${key}`);
  for (const list of Object.values(inputs.extraSources))
    for (const input of list) if (input.needs) itemByName(input.needs, 'extraSources');
  // Cookbooks and remembrances become key items when they aren't already in a data file.
  for (const [, row] of params.ShopLineupParam_Recipe) {
    const cookbook = goodsByFlag.get(num(row, 'eventFlag_forRelease'));
    if (cookbook !== undefined) addKeyItem(cookbook);
  }
  for (const [id, row] of params.ShopLineupParam) {
    const range = inputs.shops.find((shop) => id >= shop.from && id <= shop.to);
    const needed = range?.kind === 'remembrance' ? material(num(row, 'mtrlId')) : null;
    if (needed?.category === 'goods') addKeyItem(needed.id);
  }

  // --- Sources -------------------------------------------------------------------------------
  const sources = new Map<string, Source[]>();
  const add = (item: { file: AcquisitionFile; id: number } | null, source: Source) => {
    if (!item) return;
    const key = `${item.file}:${item.id}`;
    sources.set(key, [...(sources.get(key) ?? []), source]);
  };
  const fromInput = (input: SourceInput, owner: string): Source => {
    const placed =
      input.at === null ? { location: null, region: null } : resolveRef(input.at, owner);
    const source: Source = {
      kind: input.kind,
      location: placed?.location ?? null,
      region: placed?.region ?? null,
      detail: input.detail,
    };
    if (input.needs) {
      const needed = itemByName(input.needs, owner);
      if (needed) source.item = needed;
    }
    if (input.requires?.length) source.requires = input.requires;
    return source;
  };

  // Item lots in the world.
  const unplacedHints = new Map<string, number>();
  for (const [id, row] of params.ItemLotParam_map) {
    const entries = lotEntries(row)
      .map((entry) => resolveItem(entry.category, entry.id))
      .filter((item) => item !== null);
    if (!id || !entries.length) continue;
    const placed = placeLot(id);
    if (placed) {
      for (const item of entries) add(item, { kind: 'pickup', ...placed, detail: '' });
      continue;
    }
    const hint = label(row);
    const event = inputs.events[String(id)] ?? (hint ? inputs.events[hint] : undefined);
    let source: Source | undefined;
    if (event) source = fromInput(event, `event ${id}`);
    else if (hint) {
      const parts = hint.split(' - ').map((part) => part.trim());
      const place = placeFromHint(
        parts[0] === 'Teardrop Scarab' ? (parts[1] ?? '') : (parts[0] ?? ''),
      );
      if (place && parts[0] === 'Teardrop Scarab')
        source = { kind: 'pickup', ...place, detail: 'Teardrop Scarab' };
      else if (place && parts.length === 3 && (parts[1] === 'Field' || parts[1] === 'Evergaol'))
        source = {
          kind: 'boss',
          ...place,
          detail: parts[1] === 'Evergaol' ? `${parts[2]} (evergaol)` : parts[2]!,
        };
      else if (place && parts.length === 2)
        source = { kind: 'boss', ...bossGrace(place, parts[1]!), detail: parts[1]! };
      else if (place && parts.length === 1) source = { kind: 'pickup', ...place, detail: '' };
    }
    if (!source) {
      unplacedHints.set(hint ?? `lot ${id}`, (unplacedHints.get(hint ?? `lot ${id}`) ?? 0) + 1);
      source = { kind: 'quest', location: null, region: null, detail: hint ?? '' };
    }
    for (const item of entries) add(item, source);
  }
  if (unplacedHints.size)
    notes.push(
      `${unplacedHints.size} event lot hints not placed (their items need a fact or PENDING_FACTS)`,
    );

  // Enemy drops.
  const unknownEnemies = new Set<string>();
  for (const [id, row] of params.ItemLotParam_enemy) {
    const enemy = label(row);
    if (!enemy) continue;
    const spot = inputs.enemies[String(id)] ?? inputs.enemies[enemy];
    const placed = spot ? resolveRef(spot.at, `enemy "${enemy}"`) : undefined;
    if (!spot) unknownEnemies.add(enemy);
    for (const entry of lotEntries(row))
      add(resolveItem(entry.category, entry.id), {
        kind: 'enemy',
        location: placed?.location ?? null,
        region: placed?.region ?? null,
        detail: spot?.note ? `${enemy} (${spot.note})` : enemy,
      });
  }

  // Shops, remembrance trades and armor alteration.
  const unclassified = new Map<string, number>();
  for (const [id, row] of params.ShopLineupParam) {
    const shopped = shopItems(row);
    if (!shopped.length) continue;
    const range = inputs.shops.find((shop) => id >= shop.from && id <= shop.to);
    if (!range) {
      const block = `${Math.floor(id / 100) * 100}`;
      unclassified.set(block, (unclassified.get(block) ?? 0) + 1);
      continue;
    }
    if (range.kind === 'ignore') continue;
    const placed = range.at ? resolveRef(range.at, `shop ${range.from}`) : undefined;
    const source: Source = {
      kind: range.kind,
      location: placed?.location ?? null,
      region: placed?.region ?? null,
      detail: range.merchant ?? '',
    };
    const amount = num(row, 'value');
    const currency =
      num(row, 'costType') === 1 ? 'dragon-hearts' : num(row, 'costType') === 0 ? 'runes' : null;
    if (amount > 0 && currency) source.cost = { amount, currency };
    if (range.kind === 'remembrance' || range.kind === 'alteration') {
      const needed = material(num(row, 'mtrlId'));
      const resolved = needed ? resolveItem(needed.category, needed.id) : null;
      if (!resolved)
        problems.push(`shop ${id}: material ${num(row, 'mtrlId')} isn't an item we know`);
      else source.item = resolved;
    } else if (range.needs) {
      const needed = itemByName(range.needs, `shop ${range.from}`);
      if (needed) source.item = needed;
    }
    if (range.requires?.length) source.requires = range.requires;
    for (const item of shopped) add(item, { ...source });
  }
  for (const [block, count] of unclassified)
    problems.push(
      `shop lineup ${block}…: ${count} row(s) not in places.ts SHOPS (classify the range)`,
    );

  // Crafting: the release flag is the cookbook's own pickup/purchase flag; flag 0 = known from the start.
  for (const [, row] of params.ShopLineupParam_Recipe) {
    const item = shopItems(row)[0];
    if (!item) continue;
    const flag = num(row, 'eventFlag_forRelease');
    const cookbook = flag > 0 ? goodsByFlag.get(flag) : undefined;
    const book = cookbook === undefined ? null : resolveItem('goods', cookbook);
    if (flag > 0 && !book) {
      notes.push(
        `recipe for ${nameOf.get(`${item.file}:${item.id}`)}: no cookbook with flag ${flag}`,
      );
      continue;
    }
    const source: Source = {
      kind: 'craft',
      location: null,
      region: null,
      detail: book ? (goodsText.get(book.id)?.text ?? '') : 'Known from the start',
    };
    if (book) source.item = book;
    add(item, source);
  }

  // Starting classes.
  const startColumns = [
    ...['equip_Wep_Right', 'equip_Subwep_Right', 'equip_Wep_Left', 'equip_Subwep_Left'].map(
      (c) => [c, 'weapon'] as const,
    ),
    ...['equip_Arrow', 'equip_Bolt', 'equip_SubArrow', 'equip_SubBolt'].map(
      (c) => [c, 'weapon'] as const,
    ),
    ...['equip_Helm', 'equip_Armer', 'equip_Gaunt', 'equip_Leg'].map(
      (c) => [c, 'protector'] as const,
    ),
    ...[1, 2, 3, 4].map((i) => [`equip_Accessory0${i}`, 'accessory'] as const),
    ...[1, 2, 3, 4, 5, 6, 7].map((i) => [`equip_Spell_0${i}`, 'goods'] as const),
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
      (i) => [`item_${String(i).padStart(2, '0')}`, 'goods'] as const,
    ),
  ];
  for (let id = CLASS_ROWS.from; id <= CLASS_ROWS.to; id += 1) {
    const row = params.CharaInitParam.get(id);
    if (!row) {
      problems.push(`CharaInitParam ${id} (a starting class) is missing`);
      continue;
    }
    const className = (row.Name ?? '').replace(/^Class - /, '');
    for (const [column, category] of startColumns) {
      const value = row[column] === undefined ? -1 : num(row, column);
      if (value > 0)
        add(resolveItem(category, value), {
          kind: 'start',
          location: null,
          region: null,
          detail: className,
        });
    }
  }

  // Hand-written extras.
  for (const [ref, list] of Object.entries(inputs.extraSources)) {
    const item = itemByName(ref, 'extraSources');
    for (const input of list) add(item, fromInput(input, `extraSources "${ref}"`));
  }

  // A restored Great Rune needs the boss's unrestored one first.
  for (const rune of data.greatRunes) {
    const unrestored = [...keyItems].find(([, name]) => name === `${rune.name} (unrestored)`)?.[0];
    if (unrestored === undefined) continue;
    for (const source of sources.get(`greatRunes:${rune.id}`) ?? [])
      source.item = { file: 'keyItems', id: unrestored };
  }

  // --- Gates ---------------------------------------------------------------------------------
  const gates: Gate[] = inputs.gates.map((input) => {
    const gate: Gate = { id: input.id, label: input.label, requires: input.requires ?? [] };
    if (input.at !== undefined) {
      const placed = resolveRef(input.at, `gate ${input.id}`);
      if (placed?.location != null) gate.at = placed.location;
    }
    const item = gateItems.get(input.id);
    if (item !== undefined) gate.item = item;
    if (input.anyOf) gate.anyOf = input.anyOf;
    return gate;
  });
  for (const [ref, requires] of inputs.locationRequires) {
    const placed = resolveRef(ref, 'locationRequires');
    const location = placed?.location == null ? undefined : locationById.get(placed.location);
    if (location) location.requires = [...new Set([...location.requires, ...requires])];
  }

  // --- Assemble: sources de-duplicated, earliest first ---------------------------------------
  const firstInRegion = new Map<number, number>();
  for (const location of locations)
    if (!firstInRegion.has(location.region)) firstInRegion.set(location.region, location.order);
  const rank = (source: Source) =>
    source.location !== null
      ? locationById.get(source.location)!.order
      : source.region !== null
        ? (firstInRegion.get(source.region) ?? 1e6)
        : 1e6;
  const items = Object.fromEntries(
    ACQUISITION_FILES.map((file) => [file, {}]),
  ) as Acquisition['items'];
  for (const [key, list] of [...sources].sort(([a], [b]) =>
    a.localeCompare(b, 'en', { numeric: true }),
  )) {
    const [file, id] = key.split(':') as [AcquisitionFile, string];
    const unique = [...new Map(list.map((source) => [JSON.stringify(source), source])).values()];
    unique.sort(
      (a, b) =>
        rank(a) - rank(b) ||
        SOURCE_KINDS.indexOf(a.kind) - SOURCE_KINDS.indexOf(b.kind) ||
        a.detail.localeCompare(b.detail) ||
        JSON.stringify(a).localeCompare(JSON.stringify(b)),
    );
    items[file][id] = unique;
  }
  // Item IDs as keys are sorted by JS (integer-like keys), so the output is stable.

  if (unknownEnemies.size)
    notes.push(`${unknownEnemies.size} enemy types have no farm spot in places.ts`);

  return {
    acquisition: {
      regions,
      locations,
      gates,
      keyItems: [...keyItems].map(([id, name]) => ({ id, name })).sort((a, b) => a.id - b.id),
      implied: inputs.implied,
      items,
    },
    problems,
    notes,
  };
}

// --- Validation ----------------------------------------------------------------------------------

/** `'<file>:<name>'` keys of the allow-lists → `'<file>:<id>'`. */
function allowKeys(
  data: GameData,
  keyItems: Acquisition['keyItems'],
  refs: string[],
  label: string,
  problems: string[],
): Set<string> {
  const keys = new Set<string>();
  for (const ref of refs) {
    const [file, ...rest] = ref.split(':');
    const items =
      file === 'keyItems'
        ? keyItems
        : (data as unknown as Record<string, { id: number; name: string }[] | undefined>)[
            file ?? ''
          ];
    const item = items?.find((candidate) => candidate.name === rest.join(':'));
    if (item) keys.add(`${file}:${item.id}`);
    else problems.push(`${label}: no item "${ref}"`);
  }
  return keys;
}

/**
 * References resolve, the gate graph is acyclic, and every pickable item has a placed source (one with
 * a location or region, a starting class, or a prerequisite item that is itself placed) unless an
 * allow-list names it. An allow-listed item that does have one is a problem too, so the lists stay true.
 */
export function validateAcquisition(
  acquisition: Acquisition,
  data: GameData,
  inputs: AcquisitionInputs,
): string[] {
  const problems: string[] = [];
  const gateIds = new Set(acquisition.gates.map((gate) => gate.id));
  const regionIds = new Set(acquisition.regions.map((region) => region.id));
  const locationIds = new Set(acquisition.locations.map((location) => location.id));
  const keyItemIds = new Set(acquisition.keyItems.map((item) => item.id));
  const known = new Set([...keyItemIds].map((id) => `keyItems:${id}`));
  for (const file of ACQUISITION_FILES)
    if (file !== 'keyItems')
      for (const item of data[file] as { id: number }[]) known.add(`${file}:${item.id}`);
  const checkGates = (ids: string[], owner: string) => {
    for (const id of ids) if (!gateIds.has(id)) problems.push(`${owner}: unknown gate "${id}"`);
  };

  const seen = new Set<string>();
  for (const gate of acquisition.gates) {
    if (seen.has(gate.id)) problems.push(`gate "${gate.id}" is defined twice`);
    seen.add(gate.id);
    checkGates([...gate.requires, ...(gate.anyOf?.gates ?? [])], `gate ${gate.id}`);
    if (gate.item && !acquisition.items[gate.item.file][gate.item.id])
      problems.push(`gate ${gate.id}: item ${gate.item.file} ${gate.item.id} has no source`);
    if (gate.anyOf && gate.anyOf.count > gate.anyOf.gates.length)
      problems.push(
        `gate ${gate.id}: needs ${gate.anyOf.count} of ${gate.anyOf.gates.length} gates`,
      );
  }
  for (const region of acquisition.regions) checkGates(region.requires, `region ${region.name}`);
  for (const location of acquisition.locations) {
    checkGates(location.requires, `location ${location.id}`);
    if (!regionIds.has(location.region))
      problems.push(`location ${location.id}: unknown region ${location.region}`);
  }
  const { affinities, ...categories } = acquisition.implied;
  checkGates(
    [...Object.values(categories), ...Object.values(affinities).filter((g) => g !== null)],
    'implied',
  );

  // Acyclic: depth-first search over requires + anyOf edges.
  const edges = new Map(
    acquisition.gates.map((gate) => [gate.id, [...gate.requires, ...(gate.anyOf?.gates ?? [])]]),
  );
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'visiting')
      return void problems.push(`gate cycle: ${[...path, id].join(' → ')}`);
    state.set(id, 'visiting');
    for (const next of edges.get(id) ?? []) visit(next, [...path, id]);
    state.set(id, 'done');
  };
  for (const id of edges.keys()) visit(id, []);

  for (const file of ACQUISITION_FILES)
    for (const [id, list] of Object.entries(acquisition.items[file]))
      for (const source of list) {
        const owner = `${file} ${id}`;
        if (source.location !== null && !locationIds.has(source.location))
          problems.push(`${owner}: unknown location ${source.location}`);
        if (source.region !== null && !regionIds.has(source.region))
          problems.push(`${owner}: unknown region ${source.region}`);
        if (source.location !== null && source.region === null)
          problems.push(`${owner}: location without region`);
        if (source.requires) checkGates(source.requires, owner);
        if (source.item && !known.has(`${source.item.file}:${source.item.id}`))
          problems.push(
            `${owner}: needs ${source.item.file} ${source.item.id}, which is no item we know`,
          );
      }

  // Coverage.
  const placed = new Map<string, boolean>();
  const isPlaced = (key: string, depth = 0): boolean => {
    if (placed.has(key)) return placed.get(key)!;
    if (depth > 5) return false;
    const [file, id] = key.split(':') as [AcquisitionFile, string];
    const result = (acquisition.items[file][id] ?? []).some(
      (source) =>
        source.location !== null ||
        source.region !== null ||
        source.kind === 'start' ||
        (source.kind === 'craft' && !source.item) ||
        (source.item !== undefined && isPlaced(`${source.item.file}:${source.item.id}`, depth + 1)),
    );
    placed.set(key, result);
    return result;
  };
  const noSource = allowKeys(
    data,
    acquisition.keyItems,
    Object.keys(inputs.noSource),
    'noSource',
    problems,
  );
  const pending = allowKeys(data, acquisition.keyItems, inputs.pending, 'pending', problems);
  const gaps: string[] = [];
  for (const file of ACQUISITION_FILES) {
    if (file === 'keyItems') continue;
    for (const item of data[file] as { id: number; name: string }[]) {
      const key = `${file}:${item.id}`;
      const ok = isPlaced(key);
      const allowed = noSource.has(key) || pending.has(key);
      if (!ok && !allowed) gaps.push(`${file}:${item.name}`);
      if (ok && allowed)
        problems.push(`${file}:${item.name} has a placed source now; drop it from the allow-list`);
    }
  }
  if (gaps.length)
    problems.push(
      `${gaps.length} item(s) without a placed source: ${gaps.slice(0, 30).join(', ')}${gaps.length > 30 ? ', …' : ''}`,
    );
  for (const id of keyItemIds) {
    const key = `keyItems:${id}`;
    if (pending.has(key)) {
      if (isPlaced(key))
        problems.push(`${key} has a placed source now; drop it from the allow-list`);
      continue;
    }
    if (!isPlaced(key)) {
      const name = acquisition.keyItems.find((item) => item.id === id)?.name;
      problems.push(`key item ${id} "${name}" has no placed source`);
    }
  }
  return problems;
}

/** acquisition.json: top-level keys, one region/location/gate/item per line (readable diffs). */
export function formatAcquisition(acquisition: Acquisition): string {
  const list = (items: unknown[]) =>
    items.length ? `\n${items.map((item) => `    ${JSON.stringify(item)}`).join(',\n')}\n  ` : '';
  const files = ACQUISITION_FILES.map((file) => {
    const entries = Object.entries(acquisition.items[file]).map(
      ([id, sources]) => `      ${JSON.stringify(id)}: ${JSON.stringify(sources)}`,
    );
    return `    ${JSON.stringify(file)}: {${entries.length ? `\n${entries.join(',\n')}\n    ` : ''}}`;
  });
  return [
    '{',
    `  "regions": [${list(acquisition.regions)}],`,
    `  "locations": [${list(acquisition.locations)}],`,
    `  "gates": [${list(acquisition.gates)}],`,
    `  "keyItems": [${list(acquisition.keyItems)}],`,
    `  "implied": ${JSON.stringify(acquisition.implied)},`,
    `  "items": {\n${files.join(',\n')}\n  }`,
    '}',
    '',
  ].join('\n');
}
