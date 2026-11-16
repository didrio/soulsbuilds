// A tiny, hand-made export for the pipeline's tests: a few rows per param in Smithbox's CSV format and
// a text index, shaped like the real thing (docs/game-data-extraction.md). IDs follow the game's
// numbering (weapon +0 rows are multiples of 10000, affinities +100…+1200).
import { AFFINITY_KEYS } from '../../src/data/schema.ts';
import { GEM_MOUNT_FLAGS } from './constants.ts';
import type { AcquisitionInputs, AcquisitionParamName } from './acquisition.ts';
import { parseParamCsv, type Param, type TextEntry, type TextIndex } from './export.ts';
import type { ExportData } from './extract.ts';
import { DLC_BOSSES } from './tags.ts';

/** Builds a Smithbox CSV: `ID,Name,<columns>` with every unspecified cell 0. */
export function csv(columns: string[], rows: Record<string, string | number>[]): string {
  const header = ['ID', 'Name', ...columns];
  const lines = rows.map((row) => header.map((column) => row[column] ?? 0).join(','));
  return [header.join(','), ...lines].join('\n');
}

const WEAPON_COLUMNS = [
  'iconId',
  'wepType',
  'weight',
  'gemMountType',
  'swordArtsParamId',
  'attackBasePhysics',
  'attackBaseMagic',
  'attackBaseFire',
  'attackBaseThunder',
  'attackBaseDark',
  'correctStrength',
  'correctAgility',
  'correctMagic',
  'correctFaith',
  'correctLuck',
  'properStrength',
  'properAgility',
  'properMagic',
  'properFaith',
  'properLuck',
  'isNormalAttackType',
  'isBlowAttackType',
  'isSlashAttackType',
  'isThrustAttackType',
];
const AFFINITY_COLUMNS = AFFINITY_KEYS.map(
  (_, i) => `configurableWepAttr${String(i).padStart(2, '0')}`,
);
const CUT_RATES = [
  'neutralDamageCutRate',
  'blowDamageCutRate',
  'slashDamageCutRate',
  'thrustDamageCutRate',
  'magicDamageCutRate',
  'fireDamageCutRate',
  'thunderDamageCutRate',
  'darkDamageCutRate',
];
const allCut = (rate: number) => Object.fromEntries(CUT_RATES.map((column) => [column, rate]));

const dagger = {
  iconId: 1,
  wepType: 1,
  weight: 1.5,
  gemMountType: 2,
  swordArtsParamId: 100,
  attackBasePhysics: 75,
  correctStrength: 35,
  correctAgility: 55,
  properStrength: 5,
  properAgility: 9,
  isSlashAttackType: 1,
  isThrustAttackType: 1,
};

export function fixtureParams(): ExportData['params'] {
  return {
    EquipParamWeapon: parseParamCsv(
      csv(WEAPON_COLUMNS, [
        { ID: 1000000, Name: 'Dagger', ...dagger },
        { ID: 1000001, Name: 'Dagger +1', ...dagger }, // upgrade level: not an item
        { ID: 1000100, Name: 'Heavy Dagger', ...dagger },
        { ID: 1000500, Name: 'Flame Art Dagger', ...dagger },
        { ID: 1000900, Name: 'Cold Dagger', ...dagger },
        { ID: 1010000, Name: 'Unnamed in the text', ...dagger },
        {
          ID: 9060000,
          Name: 'Moonveil',
          iconId: 2,
          wepType: 13,
          weight: 6.5,
          gemMountType: 0,
          swordArtsParamId: 300,
          attackBasePhysics: 73,
          attackBaseMagic: 87,
          properMagic: 23,
          isSlashAttackType: 1,
        },
        {
          ID: 23510000,
          Name: 'Milady',
          iconId: 3,
          wepType: 93,
          weight: 5,
          gemMountType: 2,
          swordArtsParamId: 110,
          attackBasePhysics: 110,
          isNormalAttackType: 1,
        },
        { ID: 50000000, Name: 'Arrow', iconId: 4, wepType: 81, attackBasePhysics: 25 },
        { ID: 110000, Name: 'Unarmed', iconId: 6, wepType: 33 }, // excluded: bare hands
        {
          ID: 33000000,
          Name: 'Glintstone Staff', // marked changeable, but no Ash fits staffs
          iconId: 5,
          wepType: 57,
          gemMountType: 2,
          swordArtsParamId: 10,
        },
      ]),
    ),
    SwordArtsParam: parseParamCsv(
      csv(
        ['textId', 'useMagicPoint_L1', 'useMagicPoint_L2', 'useMagicPoint_R1', 'useMagicPoint_R2'],
        [
          { ID: 10, Name: 'No Skill' },
          { ID: 100, Name: 'Quickstep', useMagicPoint_L2: 3 },
          { ID: 120, Name: 'Bloody Slash', useMagicPoint_L2: 9 },
          { ID: 110, Name: 'DLC skill', useMagicPoint_L2: -1, useMagicPoint_R2: 12 },
          { ID: 300, Name: 'Transient Moonlight', useMagicPoint_L2: 18 },
        ],
      ),
    ),
    EquipParamGem: parseParamCsv(
      csv(
        ['iconId', 'swordArtsParamId', ...Object.keys(GEM_MOUNT_FLAGS), ...AFFINITY_COLUMNS],
        [
          {
            ID: 10000,
            Name: 'Ash of War: Quickstep',
            iconId: 10,
            swordArtsParamId: 100,
            canMountWep_Dagger: 1,
            canMountWep_LightGreatsword: 1,
            canMountWep_SpearLarge: 1, // no ER weapon type: dropped
            configurableWepAttr01: 1,
            configurableWepAttr05: 1,
            configurableWepAttr09: 1,
          },
          {
            ID: 10100,
            Name: 'Ash of War: Bloody Slash',
            iconId: 13,
            swordArtsParamId: 120,
            canMountWep_Dagger: 1,
            canMountWep_katana: 1,
            configurableWepAttr11: 1,
          },
          { ID: 20000, Name: 'No name in the text', iconId: 11, swordArtsParamId: 100 },
          {
            ID: 30900,
            Name: 'Ash of War: No Skill',
            iconId: 12,
            swordArtsParamId: 10,
            canMountWep_ShieldSmall: 1,
            configurableWepAttr00: 1,
          },
        ],
      ),
    ),
    EquipParamProtector: parseParamCsv(
      csv(
        [
          'protectorCategory',
          'iconIdM',
          'weight',
          'toughnessCorrectRate',
          ...CUT_RATES,
          'resistPoison',
          'resistBlood',
          'resistSleep',
          'resistCurse',
        ],
        [
          {
            ID: 40000,
            Name: 'Iron Helmet',
            protectorCategory: 0,
            iconIdM: 20,
            weight: 4.1,
            toughnessCorrectRate: 0.004,
            ...allCut(0.95),
            resistPoison: 20,
            resistBlood: 21,
            resistSleep: 22,
            resistCurse: 23,
          },
          {
            ID: 40100,
            Name: 'Iron Armor',
            protectorCategory: 1,
            iconIdM: 21,
            weight: 9,
            ...allCut(0.9),
          },
          { ID: 90000, Name: 'Hair', protectorCategory: 4, iconIdM: 22, ...allCut(1) },
        ],
      ),
    ),
    EquipParamAccessory: parseParamCsv(
      csv(
        ['iconId', 'weight', 'accessoryGroup', 'refId'],
        [
          {
            ID: 1000,
            Name: 'Crimson Amber Medallion',
            iconId: 30,
            weight: 0.3,
            accessoryGroup: 100,
            refId: 310000,
          },
        ],
      ),
    ),
    EquipParamGoods: parseParamCsv(
      csv(
        ['goodsType', 'iconId', 'sortGroupId'],
        [
          { ID: 4000, Name: 'Glintstone Pebble', goodsType: 5, iconId: 40 },
          { ID: 6000, Name: 'Heal', goodsType: 16, iconId: 41 },
          { ID: 11000, Name: 'Crimsonspill Crystal Tear', goodsType: 10, iconId: 42 },
          { ID: 191, Name: "Godrick's Great Rune", goodsType: 15, iconId: 43 },
          { ID: 200000, Name: 'Black Knife Tiche', goodsType: 8, iconId: 44 },
          { ID: 200001, Name: 'Black Knife Tiche +1', goodsType: 8, iconId: 44 },
          { ID: 1050, Name: 'Throwing Dagger', goodsType: 0, iconId: 45 },
          { ID: 8000, Name: 'A key item', goodsType: 1, iconId: 46 },
          { ID: 9000, Name: 'Bow', goodsType: 0, iconId: 47, sortGroupId: 250 }, // a gesture
          { ID: 250, Name: 'Flask of Wondrous Physick', goodsType: 9, iconId: 48 },
          // Key items (not in the site's files; the acquisition data names them).
          { ID: 8148, Name: "Godrick's Great Rune (unrestored)", goodsType: 1, iconId: 49 },
          { ID: 8158, Name: 'Spirit Calling Bell', goodsType: 1, iconId: 50 },
          { ID: 2950, Name: 'Remembrance of the Grafted', goodsType: 1, iconId: 51 },
          { ID: 9300, Name: "Nomadic Warrior's Cookbook [1]", goodsType: 1, iconId: 52 },
        ],
      ),
    ),
    Magic: parseParamCsv(
      csv(
        [
          'mp',
          'stamina',
          'slotLength',
          'requirementIntellect',
          'requirementFaith',
          'requirementLuck',
        ],
        [
          { ID: 4000, Name: 'Glintstone Pebble', mp: 7, slotLength: 1, requirementIntellect: 10 },
          { ID: 6000, Name: 'Heal', mp: 25, slotLength: 1, requirementFaith: 12 },
        ],
      ),
    ),
    SpEffectParam: spEffects([
      { ID: 310000, Name: 'Crimson Amber Medallion', maxHpRate: 1.06 },
      { ID: 310510, Name: "Radagon's Soreseal", ...radagonsSoreseal },
      { ID: 311400, Name: 'Moon of Nokstella', changeMagicSlot: 2 },
      { ID: 312100, Name: "Bull-Goat's Talisman", toughnessDamageCutRate: 0.75 },
      { ID: 999999, Name: 'Does nothing the build math reads' },
    ]),
  };
}

const radagonsSoreseal = {
  addLifeForceStatus: 5,
  addEndureStatus: 5,
  addStrengthStatus: 5,
  addDexterityStatus: 5,
};

const SP_EFFECT_RATES = [
  'maxHpRate',
  'maxMpRate',
  'maxStaminaRate',
  'equipWeightChangeRate',
  'toughnessDamageCutRate',
];
const SP_EFFECT_COLUMNS = [
  ...SP_EFFECT_RATES,
  'changeMagicSlot',
  'addLifeForceStatus',
  'addWillpowerStatus',
  'addEndureStatus',
  'addStrengthStatus',
  'addDexterityStatus',
  'addMagicStatus',
  'addFaithStatus',
  'addLuckStatus',
];

/** SpEffectParam rows: rates default to 1 (neutral) and everything else to 0, like the game's rows. */
export function spEffects(rows: Record<string, string | number>[]): Param {
  const neutral = Object.fromEntries(SP_EFFECT_RATES.map((column) => [column, 1]));
  return parseParamCsv(
    csv(
      SP_EFFECT_COLUMNS,
      rows.map((row) => ({ ...neutral, ...row })),
    ),
  );
}

/** CalcCorrectGraph rows 100, 101, 104 and 220 as the 1.17.3 export has them. */
const CURVE_COLUMNS = [0, 1, 2, 3, 4].flatMap((i) => [
  `stageMaxVal${i}`,
  `stageMaxGrowVal${i}`,
  `adjPt_maxGrowVal${i}`,
]);
const curveRow = (
  ID: number,
  Name: string,
  stages: number[],
  values: number[],
  exponents: number[],
) => ({
  ID,
  Name,
  ...Object.fromEntries(
    [0, 1, 2, 3, 4].flatMap((i) => [
      [`stageMaxVal${i}`, stages[i] ?? 0],
      [`stageMaxGrowVal${i}`, values[i] ?? 0],
      [`adjPt_maxGrowVal${i}`, exponents[i] ?? 0],
    ]),
  ),
});

const BASE_STAT_COLUMNS = [
  'soulLv',
  'baseVit',
  'baseWil',
  'baseEnd',
  'baseStr',
  'baseDex',
  'baseMag',
  'baseFai',
  'baseLuc',
];

/** The starting classes as [name, level, vigor, mind, end, str, dex, int, fai, arc] (1.17.3). */
export const CLASS_FIXTURES: [string, ...number[]][] = [
  ['Vagabond', 9, 15, 10, 11, 14, 13, 9, 9, 7],
  ['Warrior', 8, 11, 12, 11, 10, 16, 10, 8, 9],
  ['Hero', 7, 14, 9, 12, 16, 9, 7, 8, 11],
  ['Bandit', 5, 10, 11, 10, 9, 13, 9, 8, 14],
  ['Astrologer', 6, 9, 15, 9, 8, 12, 16, 7, 9],
  ['Prophet', 7, 10, 14, 8, 11, 10, 7, 16, 10],
  ['Confessor', 10, 10, 13, 10, 12, 12, 9, 14, 9],
  ['Samurai', 9, 12, 11, 13, 12, 15, 9, 8, 8],
  ['Prisoner', 9, 11, 12, 11, 11, 14, 14, 6, 9],
  ['Wretch', 1, 10, 10, 10, 10, 10, 10, 10, 10],
];

/** The params scripts/data/character.ts reads, with the real classes and curves. */
export function fixtureCharacterParams() {
  return {
    CharaInitParam: parseParamCsv(
      csv(
        BASE_STAT_COLUMNS,
        CLASS_FIXTURES.map(([name, ...values], i) => ({
          ID: 3000 + i,
          Name: `Class - ${name}`,
          ...Object.fromEntries(BASE_STAT_COLUMNS.map((column, j) => [column, values[j] ?? 0])),
        })),
      ),
    ),
    CalcCorrectGraph: parseParamCsv(
      csv(CURVE_COLUMNS, [
        curveRow(
          100,
          'HP Scaling - Vigor',
          [1, 25, 40, 60, 99],
          [300, 800, 1450, 1900, 2100],
          [1.5, 1.1, -1.2, -1.2, 1],
        ),
        curveRow(
          101,
          'FP Scaling - Mind',
          [1, 15, 35, 60, 99],
          [50, 95, 200, 350, 450],
          [1, 1, -1.2, 1, 1],
        ),
        curveRow(
          104,
          'Stamina - Endurance',
          [1, 15, 30, 50, 99],
          [80, 105, 130, 155, 170],
          [1, 1, 1, 1, 1],
        ),
        curveRow(
          220,
          'Equip Load - Endurance',
          [1, 8, 25, 60, 99],
          [45, 45, 72, 120, 160],
          [1, 1, 1.1, 1, 1],
        ),
      ]),
    ),
    SpEffectParam: spEffects([]),
  };
}

/** Text index entries: `[id, text]` (base game) or `[id, text, dlc]`. */
type Entries = [number, string, number?][];
const fmg = (entries: Entries) =>
  new Map<number, TextEntry>(entries.map(([id, text, dlc = 0]) => [id, { text, dlc }]));

export function fixtureText(): TextIndex {
  return new Map([
    [
      'WeaponName',
      fmg([
        [1000000, 'Dagger'],
        [9060000, 'Moonveil'],
        [23510000, 'Milady', 2],
        [50000000, 'Arrow'],
        [110000, 'Unarmed'],
        [33000000, 'Glintstone Staff'],
      ]),
    ],
    [
      'ArtsName',
      fmg([
        [10, 'No Skill'],
        [100, 'Quickstep'],
        [120, 'Bloody Slash'],
        [110, 'Unending Dance', 2],
        [300, 'Transient Moonlight'],
      ]),
    ],
    [
      'GemName',
      fmg([
        [10000, 'Ash of War: Quickstep'],
        [10100, 'Ash of War: Bloody Slash'],
        [30900, 'Ash of War: No Skill'],
      ]),
    ],
    [
      'ProtectorName',
      fmg([
        [40000, 'Iron Helmet'],
        [40100, 'Iron Armor'],
        [90000, 'Hair'],
      ]),
    ],
    ['AccessoryName', fmg([[1000, 'Crimson Amber Medallion']])],
    ['AccessoryInfo', fmg([[1000, 'Raises maximum HP']])],
    [
      'GoodsName',
      fmg([
        [4000, 'Glintstone Pebble'],
        [6000, 'Heal'],
        [11000, 'Crimsonspill Crystal Tear'],
        [191, "Godrick's Great Rune"],
        [200000, 'Black Knife Tiche'],
        [200001, 'Black Knife Tiche + 1'],
        [1050, 'Throwing Dagger'],
        [8000, 'Some Key'],
        [9000, 'Bow'],
        [250, 'Flask of Wondrous Physick'],
        [8148, "Godrick's Great Rune"],
        [8158, 'Spirit Calling Bell'],
        [2950, 'Remembrance of the Grafted'],
        [9300, "Nomadic Warrior's Cookbook [1]"],
      ]),
    ],
    [
      'GR_MenuText',
      fmg([
        ...['Dagger', 'Katana', 'Glintstone Staff', 'Arrow', 'Light Greatsword'].map(
          (name, i): [number, string] => [60000 + i, name],
        ),
        // Travel-menu regions (BonfireWarpSubCategoryParam textId).
        [900001, 'Limgrave'],
        [900002, 'Stormveil Castle'],
        [900003, 'Caelid'],
      ]),
    ],
    ['GoodsInfo', fmg([[4000, 'Fires a glintstone pebble']])],
    ['PlaceName', fmg(GRACES.map((grace): [number, string] => [grace.textId1, grace.Name]))],
    [
      'NpcName',
      fmg(DLC_BOSSES.map((boss, i): [number, string, number] => [i, `${boss}, the Test`, 2])),
    ],
  ]);
}

export const fixtureExport = (): ExportData => ({ params: fixtureParams(), text: fixtureText() });

// --- Acquisition (T14) ---------------------------------------------------------------------------

/** Graces: two on Limgrave tile 42_36, one on 44_36 (shifted west), Stormveil, Caelid, a tunnel. */
const GRACES: { ID: number; Name: string; textId1: number; [column: string]: string | number }[] = [
  {
    ID: 61423600,
    Name: 'Church of Elleh',
    bonfireSubCategoryId: 61000,
    bonfireSubCategorySortId: 20,
    areaNo: 60,
    gridXNo: 42,
    gridZNo: 36,
    posX: 0,
    posZ: 0,
    textId1: 700001,
  },
  {
    ID: 61423601,
    Name: 'The First Step',
    bonfireSubCategoryId: 61000,
    bonfireSubCategorySortId: 10,
    areaNo: 60,
    gridXNo: 42,
    gridZNo: 36,
    posX: -90,
    posZ: -90,
    textId1: 700002,
  },
  {
    ID: 61443600,
    Name: 'Waypoint Ruins Cellar',
    bonfireSubCategoryId: 61000,
    bonfireSubCategorySortId: 30,
    areaNo: 60,
    gridXNo: 44,
    gridZNo: 36,
    posX: -50,
    posZ: 0,
    textId1: 700003,
  },
  {
    ID: 100008,
    Name: 'Stormveil Main Gate',
    bonfireSubCategoryId: 10000,
    bonfireSubCategorySortId: 30,
    areaNo: 10,
    gridXNo: 0,
    gridZNo: 0,
    textId1: 700004,
  },
  {
    ID: 100000,
    Name: 'Godrick the Grafted',
    bonfireSubCategoryId: 10000,
    bonfireSubCategorySortId: 999,
    areaNo: 10,
    gridXNo: 0,
    gridZNo: 0,
    textId1: 700005,
  },
  {
    ID: 64523800,
    Name: 'Starscourge Radahn',
    bonfireSubCategoryId: 64000,
    bonfireSubCategorySortId: 420,
    areaNo: 60,
    gridXNo: 52,
    gridZNo: 38,
    textId1: 700006,
  },
  {
    ID: 320700,
    Name: 'Gael Tunnel',
    bonfireSubCategoryId: 64000,
    bonfireSubCategorySortId: 100,
    areaNo: 32,
    gridXNo: 7,
    gridZNo: 0,
    textId1: 700007,
  },
];

const LOT_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((i) => [
  `lotItemId0${i}`,
  `lotItemCategory0${i}`,
  `lotItemBasePoint0${i}`,
  `getItemFlagId0${i}`,
]);
/** One item lot: `[category, id]` entries (1 goods, 2 weapon, 3 armor, 4 talisman, 5 Ash of War). */
const lot = (ID: number, Name: string, entries: [number, number][], flag = 0) => ({
  ID,
  Name,
  getItemFlagId: flag,
  ...Object.fromEntries(
    entries.flatMap(([category, id], i) => [
      [`lotItemId0${i + 1}`, id],
      [`lotItemCategory0${i + 1}`, category],
      [`lotItemBasePoint0${i + 1}`, 1000],
    ]),
  ),
});
const SHOP_COLUMNS = [
  'equipId',
  'value',
  'mtrlId',
  'eventFlag_forStock',
  'eventFlag_forRelease',
  'equipType',
  'costType',
];
const CLASS_COLUMNS = [
  'equip_Wep_Right',
  'equip_Subwep_Right',
  'equip_Wep_Left',
  'equip_Subwep_Left',
  'equip_Arrow',
  'equip_Bolt',
  'equip_SubArrow',
  'equip_SubBolt',
  'equip_Helm',
  'equip_Armer',
  'equip_Gaunt',
  'equip_Leg',
  ...[1, 2, 3, 4].map((i) => `equip_Accessory0${i}`),
  ...[1, 2, 3, 4, 5, 6, 7].map((i) => `equip_Spell_0${i}`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `item_${String(i).padStart(2, '0')}`),
];

export function fixtureAcquisitionParams(): Record<AcquisitionParamName, Param> {
  return {
    BonfireWarpSubCategoryParam: parseParamCsv(
      csv(
        ['textId'],
        [
          { ID: 61000, Name: 'Limgrave', textId: 900001 },
          { ID: 10000, Name: 'Stormveil Castle', textId: 900002 },
          { ID: 64000, Name: 'Caelid', textId: 900003 },
        ],
      ),
    ),
    BonfireWarpParam: parseParamCsv(
      csv(
        [
          'textId1',
          'bonfireSubCategoryId',
          'bonfireSubCategorySortId',
          'areaNo',
          'gridXNo',
          'gridZNo',
          'posX',
          'posZ',
        ],
        [{ ID: 0, Name: 'unused row 0', textId1: 700001 }, ...GRACES],
      ),
    ),
    WorldMapLegacyConvParam: parseParamCsv(
      csv(
        [
          'srcAreaNo',
          'srcGridXNo',
          'dstAreaNo',
          'dstGridXNo',
          'dstGridZNo',
          'dstPosX',
          'dstPosZ',
          'isBasePoint',
        ],
        [
          {
            ID: 1,
            Name: 'a cave with no grace',
            srcAreaNo: 31,
            srcGridXNo: 0,
            dstAreaNo: 60,
            dstGridXNo: 44,
            dstGridZNo: 36,
            dstPosX: 10,
            dstPosZ: 10,
            isBasePoint: 1,
          },
        ],
      ),
    ),
    ItemLotParam_map: parseParamCsv(
      csv(
        ['getItemFlagId', ...LOT_COLUMNS],
        [
          lot(1042360010, '', [
            [2, 1000100],
            [1, 8158],
          ]), // Heavy Dagger → Dagger; the bell
          lot(1043360000, '', [[3, 40000]]), // no grace on 43_36: nearest is the Waypoint
          lot(1044360020, '', [[1, 9300]], 67000), // a cookbook; its flag releases a recipe
          lot(1042370050, '', [[1, 191]]), // restored Great Rune at a tower
          lot(1042360030, '', [[6, 5000]]), // a weapon with an Ash of War on it: both
          lot(31000010, '', [[4, 1000]]), // a cave without a grace (legacy conversion)
          lot(10000100, '[LD - Stormveil] Glintstone Pebble', [[1, 4000]]),
          lot(942370070, '[Troll Carriage] Arrow', [[2, 50000000]]),
          lot(20661, '[Gael Tunnel - Magma Wyrm] Moonveil', [[2, 9060000]]),
          lot(10010, "[Stormveil - Godrick] Godrick's Great Rune", [[1, 8148]]),
          lot(10011, '[Stormveil - Godrick] Remembrance of the Grafted', [[1, 2950]]),
          lot(101000, '[Knight Somebody] Ash of War: Quickstep', [[5, 10000]]),
          lot(102000, '[Mystery] Black Knife Tiche', [[1, 200001]]), // +1 copy → the base ash
        ],
      ),
    ),
    ItemLotParam_enemy: parseParamCsv(
      csv(
        ['getItemFlagId', ...LOT_COLUMNS],
        [lot(431100000, '[Godrick Soldier] Milady', [[2, 23510000]])],
      ),
    ),
    ShopLineupParam: parseParamCsv(
      csv(SHOP_COLUMNS, [
        {
          ID: 100500,
          Name: '[Merchant Kale] Throwing Dagger',
          equipId: 1050,
          value: 100,
          equipType: 3,
        },
        {
          ID: 101900,
          Name: '[Remembrance of the Grafted] Glintstone Staff',
          equipId: 33000000,
          mtrlId: 900000,
          equipType: 0,
        },
        {
          ID: 110000,
          Name: '[Alteration] Iron Armor',
          equipId: 40100,
          mtrlId: 900100,
          equipType: 1,
        },
        { ID: 110200, Name: '[Reversion] Iron Armor', equipId: 40100, equipType: 1 },
        {
          ID: 100501,
          Name: '[Merchant Kale] Milady - Bloody Slash',
          equipId: 5000,
          value: 2000,
          equipType: 5,
        },
      ]),
    ),
    ShopLineupParam_Recipe: parseParamCsv(
      csv(SHOP_COLUMNS, [
        { ID: 1, Name: '', equipId: 1050, equipType: 3 },
        {
          ID: 32000,
          Name: "Arrow - Nomadic Warrior's Cookbook [1]",
          equipId: 50000000,
          equipType: 0,
          eventFlag_forRelease: 67000,
        },
      ]),
    ),
    EquipMtrlSetParam: parseParamCsv(
      csv(
        ['materialId01', 'materialCate01'],
        [
          {
            ID: 900000,
            Name: 'Remembrance of the Grafted * 1',
            materialId01: 2950,
            materialCate01: 4,
          },
          { ID: 900100, Name: '', materialId01: 40000, materialCate01: 1 },
        ],
      ),
    ),
    EquipParamCustomWeapon: parseParamCsv(
      csv(
        ['baseWepId', 'gemId'],
        [{ ID: 5000, Name: 'Milady +1 - Bloody Slash', baseWepId: 23510001, gemId: 10100 }],
      ),
    ),
    CharaInitParam: parseParamCsv(
      csv(
        CLASS_COLUMNS,
        [
          'Vagabond',
          'Warrior',
          'Hero',
          'Bandit',
          'Astrologer',
          'Prophet',
          'Confessor',
          'Samurai',
          'Prisoner',
          'Wretch',
        ].map((name, i) => ({
          ID: 3000 + i,
          Name: `Class - ${name}`,
          ...(i === 0 ? { equip_Wep_Right: 1000000 } : {}),
        })),
      ),
    ),
  };
}

export function fixtureAcquisitionInputs(): AcquisitionInputs {
  return {
    regions: [
      { name: 'Limgrave', requires: [] },
      { name: 'Stormveil Castle', requires: ['margit'] },
      { name: 'Caelid', requires: [] },
    ],
    locationRequires: [['Starscourge Radahn', ['godrick']]],
    gates: [
      { id: 'margit', label: 'Defeat Margit' },
      { id: 'godrick', label: 'Defeat Godrick', at: 'Godrick the Grafted', requires: ['margit'] },
      { id: 'spirit-bell', label: 'Get the Spirit Calling Bell', item: 'Spirit Calling Bell' },
      { id: 'two', label: 'Any one boss', anyOf: { count: 1, gates: ['margit', 'godrick'] } },
    ],
    implied: {
      ashesOfWar: 'margit',
      spiritAshes: 'spirit-bell',
      tears: 'margit',
      affinities: Object.fromEntries(
        AFFINITY_KEYS.map((key) => [key, key === 'standard' ? null : 'margit']),
      ) as AcquisitionInputs['implied']['affinities'],
    },
    shops: [
      { from: 100500, to: 100524, kind: 'shop', merchant: 'Merchant Kalé', at: 'Church of Elleh' },
      {
        from: 101900,
        to: 101949,
        kind: 'remembrance',
        merchant: 'Finger Reader Enia',
        at: 'region:Limgrave',
      },
      {
        from: 110000,
        to: 110199,
        kind: 'alteration',
        merchant: 'Alter at a Site of Grace',
        at: null,
      },
      { from: 110200, to: 110399, kind: 'ignore' },
    ],
    aliases: { Stormveil: 'region:Stormveil Castle' },
    events: {
      'Knight Somebody': { kind: 'quest', at: 'Church of Elleh', detail: 'Knight Somebody' },
    },
    enemies: { 'Godrick Soldier': { at: 'Stormveil Main Gate', note: 'by the gate' } },
    extraSources: {
      'consumables:Flask of Wondrous Physick': [
        { kind: 'quest', at: 'The First Step', detail: 'Melina' },
      ],
    },
    noSource: { 'spells:Heal': 'Not in this fixture' },
    pending: ['tears:Crimsonspill Crystal Tear', 'spiritAshes:Black Knife Tiche'],
  };
}
