// Hand-written progression for the acquisition data (T14): the canonical route order through the game's
// regions, which gates each region needs, and the gate graph itself. T15's solver composes a build's
// route from these; "efficient" means a sensible earliest-first order, not a proven shortest path.
//
// Region names are the game's travel-menu names (BonfireWarpSubCategoryParam text); the pipeline fails if
// one is missing, unknown or out of this list. Gate places are grace names or IDs (acquisition.ts PlaceRef).
// Facts checked against the wiki (owner's call, 2026-11-15; facts only, no text copied). Every gate but
// the any-of ones says why it's on the route (`reason`, T35; the pipeline fails without one).
import type { AcquisitionInputs, GateInput } from './acquisition.ts';

/** Every region, in the order a typical playthrough reaches it. */
export const REGIONS: AcquisitionInputs['regions'] = [
  { name: 'Stranded Graveyard', requires: [] },
  { name: 'Limgrave', requires: [] },
  { name: 'Roundtable Hold', requires: [] },
  { name: 'Stormhill', requires: [] },
  { name: 'Weeping Peninsula', requires: [] },
  { name: 'Stormveil Castle', requires: ['margit'] },
  { name: 'Liurnia of the Lakes', requires: ['margit'] },
  { name: 'Bellum Highway', requires: ['margit'] },
  { name: 'Academy of Raya Lucaria', requires: ['academy-key'] },
  { name: 'Caelid', requires: [] },
  { name: 'Swamp of Aeonia', requires: [] },
  { name: "Greyoll's Dragonbarrow", requires: [] },
  { name: 'Siofra River', requires: [] },
  { name: 'Nokron, Eternal City', requires: ['radahn'] },
  { name: 'Ainsel River', requires: ['margit'] },
  { name: 'Ainsel River Main', requires: ['margit'] },
  { name: 'Ruin-Strewn Precipice', requires: ['margit'] },
  { name: 'Altus Plateau', requires: ['margit'] },
  { name: 'Mt. Gelmir', requires: ['margit'] },
  { name: 'Volcano Manor', requires: ['margit'] },
  { name: 'Lake of Rot', requires: ['ranni-quest'] },
  { name: 'Moonlight Altar', requires: ['ranni-quest'] },
  { name: 'Capital Outskirts', requires: ['margit'] },
  { name: 'Leyndell, Royal Capital', requires: ['two-great-runes'] },
  { name: 'Subterranean Shunning-Grounds', requires: ['two-great-runes'] },
  { name: 'Deeproot Depths', requires: ['radahn'] },
  { name: 'Forbidden Lands', requires: ['morgott'] },
  { name: 'Mountaintops of the Giants', requires: ['morgott'] },
  { name: 'Flame Peak', requires: ['morgott'] },
  { name: 'Consecrated Snowfield', requires: ['haligtree-medallion'] },
  { name: "Miquella's Haligtree", requires: ['haligtree-medallion'] },
  { name: 'Elphael, Brace of the Haligtree', requires: ['haligtree-medallion'] },
  { name: 'Mohgwyn Palace', requires: ['mohgwyn'] },
  { name: 'Crumbling Farum Azula', requires: ['fire-giant'] },
  { name: 'Leyndell, Ashen Capital', requires: ['maliketh'] },
  { name: 'Stone Platform', requires: ['maliketh'] },
  // Shadow of the Erdtree: everything needs Mohg and Radahn beaten.
  { name: 'Gravesite Plain', requires: ['dlc'] },
  { name: 'Castle Ensis', requires: ['dlc'] },
  { name: 'Belurat, Tower Settlement', requires: ['dlc'] },
  { name: 'Cerulean Coast', requires: ['dlc'] },
  { name: "Charo's Hidden Grave", requires: ['dlc'] },
  { name: 'Stone Coffin Fissure', requires: ['dlc'] },
  { name: 'Foot of the Jagged Peak', requires: ['dlc'] },
  { name: 'Jagged Peak', requires: ['dlc'] },
  { name: 'Scadu Altus', requires: ['dlc'] },
  { name: 'Ancient Ruins of Rauh', requires: ['dlc'] },
  { name: 'Rauh Base', requires: ['dlc'] },
  { name: 'Shadow Keep', requires: ['dlc'] },
  { name: 'Shadow Keep, Church District', requires: ['dlc'] },
  { name: 'Specimen Storehouse', requires: ['dlc'] },
  { name: 'Scaduview', requires: ['dlc'] },
  { name: 'Abyssal Woods', requires: ['dlc'] },
  { name: "Midra's Manse", requires: ['dlc'] },
  { name: 'Enir-Ilim', requires: ['messmer'] },
];

/** Graces that need more than their region. */
export const LOCATION_REQUIRES: AcquisitionInputs['locationRequires'] = [];

const whetblade = (id: string, item: string, affinities: string): GateInput => ({
  id,
  label: `Get the ${item}`,
  item,
  requires: ['whetstone-knife'],
  reason: `Unlocks the ${affinities} affinities`,
});

export const GATES: GateInput[] = [
  // Bosses that open the map.
  {
    id: 'margit',
    label: 'Defeat Margit, the Fell Omen',
    at: 'Margit, the Fell Omen',
    reason: 'Main-path boss: he bars the way to Stormveil Castle and everything beyond',
  },
  {
    id: 'godrick',
    label: 'Defeat Godrick the Grafted',
    at: 'Godrick the Grafted',
    requires: ['margit'],
    reason: 'Shardbearer: his Great Rune is one of the two that open Leyndell',
  },
  {
    id: 'rennala',
    label: 'Defeat Rennala, Queen of the Full Moon',
    at: 'Raya Lucaria Grand Library',
    requires: ['academy-key'],
    reason: 'Shardbearer: her Great Rune is one of the two that open Leyndell',
  },
  {
    id: 'radahn',
    label: 'Defeat Starscourge Radahn',
    at: 'Starscourge Radahn',
    reason: 'Shardbearer: his Great Rune counts towards Leyndell, and his fall opens Nokron',
  },
  {
    id: 'rykard',
    label: 'Defeat Rykard, Lord of Blasphemy',
    at: 'Rykard, Lord of Blasphemy',
    requires: ['margit'],
    reason: 'Shardbearer: his Great Rune is one of the two that open Leyndell',
  },
  {
    id: 'two-great-runes',
    label: 'Hold two Great Runes',
    requires: [],
    anyOf: { count: 2, gates: ['godrick', 'rennala', 'radahn', 'rykard'] },
  },
  {
    id: 'morgott',
    label: 'Defeat Morgott, the Omen King',
    at: 'Elden Throne@Leyndell, Royal Capital',
    requires: ['two-great-runes'],
    reason: 'Main-path boss: opens the Forbidden Lands and the Mountaintops of the Giants',
  },
  {
    id: 'fire-giant',
    label: 'Defeat the Fire Giant',
    at: 'Fire Giant',
    requires: ['morgott'],
    reason: 'Main-path boss: opens the way to Crumbling Farum Azula',
  },
  {
    id: 'maliketh',
    label: 'Defeat Maliketh, the Black Blade',
    at: 'Maliketh, the Black Blade',
    requires: ['fire-giant'],
    reason: 'Main-path boss: opens the Ashen Capital',
  },
  // Keys and medallions.
  {
    id: 'academy-key',
    label: 'Get the Academy Glintstone Key',
    item: 'Academy Glintstone Key',
    requires: ['margit'],
    reason: 'Opens the Academy of Raya Lucaria',
  },
  {
    id: 'ranni-quest',
    label: "Follow Ranni's quest with the Fingerslayer Blade into the Lake of Rot",
    requires: ['radahn'],
    reason: 'The only way to the Lake of Rot and the Moonlight Altar',
  },
  {
    id: 'haligtree-medallion-left',
    label: 'Get the Haligtree Secret Medallion (Left)',
    item: 'Haligtree Secret Medallion (Left)',
    reason: 'Half of the key to the Haligtree',
  },
  {
    id: 'haligtree-medallion-right',
    label: 'Get the Haligtree Secret Medallion (Right)',
    item: 'Haligtree Secret Medallion (Right)',
    reason: 'Half of the key to the Haligtree',
  },
  {
    id: 'haligtree-medallion',
    label: 'Join the Haligtree Secret Medallion at the Grand Lift of Rold',
    requires: ['haligtree-medallion-left', 'haligtree-medallion-right', 'morgott'],
    reason: 'The lift takes you up to the Consecrated Snowfield and the Haligtree',
  },
  {
    id: 'varre-medal',
    label: "Get the Pureblood Knight's Medal from White Mask Varré",
    item: "Pureblood Knight's Medal",
    reason: 'Takes you to Mohgwyn Palace',
  },
  {
    id: 'mohgwyn',
    label: 'Reach Mohgwyn Palace',
    requires: [],
    anyOf: { count: 1, gates: ['varre-medal', 'haligtree-medallion'] },
  },
  {
    id: 'mohg',
    label: 'Defeat Mohg, Lord of Blood',
    at: 'Cocoon of the Empyrean',
    requires: ['mohgwyn'],
    reason: 'Shardbearer: with Radahn beaten too, Shadow of the Erdtree opens',
  },
  {
    id: 'dlc',
    label: "Touch Miquella's arm in Mohgwyn Palace (Shadow of the Erdtree)",
    requires: ['mohg', 'radahn'],
    reason: 'Takes you to the Land of Shadow',
  },
  {
    id: 'messmer',
    label: 'Defeat Messmer the Impaler',
    at: "Messmer's Dark Chamber",
    requires: ['dlc'],
    reason: 'Main-path boss: opens the way to Enir-Ilim',
  },
  // Tools an item type needs.
  {
    id: 'spirit-bell',
    label: 'Get the Spirit Calling Bell from Renna',
    item: 'Spirit Calling Bell',
    reason: 'Lets you summon Spirit Ashes',
  },
  {
    id: 'whetstone-knife',
    label: 'Get the Whetstone Knife',
    item: 'Whetstone Knife',
    reason: 'Lets you put Ashes of War on weapons',
  },
  {
    id: 'physick-flask',
    label: 'Get the Flask of Wondrous Physick',
    item: 'Flask of Wondrous Physick',
    reason: 'Holds the Crystal Tears you mix',
  },
  whetblade('iron-whetblade', 'Iron Whetblade', 'Heavy, Keen and Quality'),
  whetblade('red-hot-whetblade', 'Red-Hot Whetblade', 'Fire and Flame Art'),
  whetblade('sanctified-whetblade', 'Sanctified Whetblade', 'Lightning and Sacred'),
  whetblade('glintstone-whetblade', 'Glintstone Whetblade', 'Magic and Cold'),
  whetblade('black-whetblade', 'Black Whetblade', 'Poison, Blood and Occult'),
];

/** Gates an item needs by what it is (T15 adds them to the route). */
export const IMPLIED: AcquisitionInputs['implied'] = {
  ashesOfWar: 'whetstone-knife',
  spiritAshes: 'spirit-bell',
  tears: 'physick-flask',
  affinities: {
    standard: null,
    heavy: 'iron-whetblade',
    keen: 'iron-whetblade',
    quality: 'iron-whetblade',
    fire: 'red-hot-whetblade',
    'flame-art': 'red-hot-whetblade',
    lightning: 'sanctified-whetblade',
    sacred: 'sanctified-whetblade',
    magic: 'glintstone-whetblade',
    cold: 'glintstone-whetblade',
    poison: 'black-whetblade',
    blood: 'black-whetblade',
    occult: 'black-whetblade',
  },
};
