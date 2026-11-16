// Hand-written progression for the acquisition data (T14): the canonical route order through the game's
// regions, which gates each region needs, and the gate graph itself. T15's solver composes a build's
// route from these; "efficient" means a sensible earliest-first order, not a proven shortest path.
//
// Region names are the game's travel-menu names (BonfireWarpSubCategoryParam text); the pipeline fails if
// one is missing, unknown or out of this list. Gate places are grace names or IDs (acquisition.ts PlaceRef).
// Facts checked against the wiki (owner's call, 2026-11-15; facts only, no text copied).
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

const whetblade = (id: string, item: string): GateInput => ({
  id,
  label: `Get the ${item}`,
  item,
  requires: ['whetstone-knife'],
});

export const GATES: GateInput[] = [
  // Bosses that open the map.
  { id: 'margit', label: 'Defeat Margit, the Fell Omen', at: 'Margit, the Fell Omen' },
  {
    id: 'godrick',
    label: 'Defeat Godrick the Grafted',
    at: 'Godrick the Grafted',
    requires: ['margit'],
  },
  {
    id: 'rennala',
    label: 'Defeat Rennala, Queen of the Full Moon',
    at: 'Raya Lucaria Grand Library',
    requires: ['academy-key'],
  },
  { id: 'radahn', label: 'Defeat Starscourge Radahn', at: 'Starscourge Radahn' },
  {
    id: 'rykard',
    label: 'Defeat Rykard, Lord of Blasphemy',
    at: 'Rykard, Lord of Blasphemy',
    requires: ['margit'],
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
  },
  { id: 'fire-giant', label: 'Defeat the Fire Giant', at: 'Fire Giant', requires: ['morgott'] },
  {
    id: 'maliketh',
    label: 'Defeat Maliketh, the Black Blade',
    at: 'Maliketh, the Black Blade',
    requires: ['fire-giant'],
  },
  // Keys and medallions.
  {
    id: 'academy-key',
    label: 'Get the Academy Glintstone Key',
    item: 'Academy Glintstone Key',
    requires: ['margit'],
  },
  {
    id: 'ranni-quest',
    label: "Follow Ranni's quest with the Fingerslayer Blade into the Lake of Rot",
    requires: ['radahn'],
  },
  {
    id: 'haligtree-medallion-left',
    label: 'Get the Haligtree Secret Medallion (Left)',
    item: 'Haligtree Secret Medallion (Left)',
  },
  {
    id: 'haligtree-medallion-right',
    label: 'Get the Haligtree Secret Medallion (Right)',
    item: 'Haligtree Secret Medallion (Right)',
  },
  {
    id: 'haligtree-medallion',
    label: 'Join the Haligtree Secret Medallion at the Grand Lift of Rold',
    requires: ['haligtree-medallion-left', 'haligtree-medallion-right', 'morgott'],
  },
  {
    id: 'varre-medal',
    label: "Get the Pureblood Knight's Medal from White Mask Varré",
    item: "Pureblood Knight's Medal",
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
  },
  {
    id: 'dlc',
    label: "Touch Miquella's arm in Mohgwyn Palace (Shadow of the Erdtree)",
    requires: ['mohg', 'radahn'],
  },
  {
    id: 'messmer',
    label: 'Defeat Messmer the Impaler',
    at: "Messmer's Dark Chamber",
    requires: ['dlc'],
  },
  // Tools an item type needs.
  {
    id: 'spirit-bell',
    label: 'Get the Spirit Calling Bell from Renna',
    item: 'Spirit Calling Bell',
  },
  { id: 'whetstone-knife', label: 'Get the Whetstone Knife', item: 'Whetstone Knife' },
  {
    id: 'physick-flask',
    label: 'Get the Flask of Wondrous Physick',
    item: 'Flask of Wondrous Physick',
  },
  whetblade('iron-whetblade', 'Iron Whetblade'),
  whetblade('red-hot-whetblade', 'Red-Hot Whetblade'),
  whetblade('sanctified-whetblade', 'Sanctified Whetblade'),
  whetblade('glintstone-whetblade', 'Glintstone Whetblade'),
  whetblade('black-whetblade', 'Black Whetblade'),
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
