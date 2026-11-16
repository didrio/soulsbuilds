// Hand-written event facts for the acquisition data (T14): boss and NPC rewards the row-name hints can't
// place (all the DLC ones have no hint), items the params don't hand out at all (quest rewards,
// keepsakes), and the explicit allow-lists. Facts checked against the wiki (owner's call, 2026-11-15:
// facts only, no text copied). Item names are '<file>:<in-game name>'.
import type { AcquisitionInputs, PlaceRef } from './acquisition.ts';

type Event = AcquisitionInputs['events'][string];
const quest = (at: PlaceRef | null, detail: string, extra: Partial<Event> = {}): Event => ({
  kind: 'quest',
  at,
  detail,
  ...extra,
});
const boss = (at: PlaceRef, detail: string): Event => ({ kind: 'boss', at, detail });
const pickup = (at: PlaceRef, detail: string): Event => ({ kind: 'pickup', at, detail });
/** The same event for several lot IDs. */
const lots = (ids: number[], event: Event) =>
  Object.fromEntries(ids.map((id) => [String(id), event]));
const ROUNDTABLE = 'Table of Lost Grace';

/**
 * Event lots by lot ID (`'20661'`) or by hint label (`'Knight Bernahl'`, which covers every lot with that
 * label). A quest reward sits where the NPC's quest pays out (often its last step); `detail` says who and
 * roughly when. Checked against the wiki and quest guides (T19), facts only.
 */
export const EVENTS: AcquisitionInputs['events'] = {
  // --- Base game: NPCs and quests (by hint label) ---
  'Melina - Third Grace Found': quest(
    'Gatefront',
    'Melina, once you have rested at three Sites of Grace',
  ),
  'White-Faced Varre - 3 Invasions': quest(
    'region:Liurnia of the Lakes',
    'White-Faced Varre at the Rose Church, after three invasions',
  ),
  'White-Faced Varre - Returned Oath-Cloth': quest(
    'region:Liurnia of the Lakes',
    'White-Faced Varre at the Rose Church, after you return the oath-cloth',
  ),
  'White-Faced Varre - Invasion': quest(
    'region:Mohgwyn Palace',
    'White-Faced Varre: defeat him at the end of his quest',
  ),
  'Corpse - White-Faced Varre - Invasion': quest(
    'region:Mohgwyn Palace',
    'White-Faced Varre: defeat him at the end of his quest',
  ),
  Tanith: quest('Volcano Manor', 'Tanith: the Volcano Manor requests, and after Rykard'),
  Hyetta: quest('Frenzied Flame Proscription', 'Hyetta, at the end of her quest'),
  Rya: quest('Volcano Manor', "Rya's quest (Volcano Manor)"),
  'Corpse - Rya': quest('Volcano Manor', "Rya's quest (Volcano Manor)"),
  'Sorceress Sellen': quest('Waypoint Ruins Cellar', "Sorceress Sellen's quest"),
  'Corpse - Sorceress Sellen': quest('Waypoint Ruins Cellar', "Sorceress Sellen's quest"),
  'Witch-Hunter Jerren': quest(
    'Raya Lucaria Grand Library',
    "Witch-Hunter Jerren, at the end of Sellen's quest",
  ),
  'Corpse - Witch-Hunter Jerren': quest(
    'Raya Lucaria Grand Library',
    "Witch-Hunter Jerren, at the end of Sellen's quest",
  ),
  'Master Lusat': quest('Sellia Hideaway', "Master Lusat (Sellen's quest)"),
  'Corpse - Master Lusat': quest('Sellia Hideaway', "Master Lusat (Sellen's quest)"),
  'Master Azur': quest('Primeval Sorcerer Azur', "Master Azur (Sellen's quest)"),
  'Corpse - Master Azur': quest('Primeval Sorcerer Azur', "Master Azur (Sellen's quest)"),
  Albus: quest('Village of the Albinaurics', 'Albus, hiding as a pot in the village'),
  'Corpse - Albus': quest('Village of the Albinaurics', 'Albus, hiding as a pot in the village'),
  Latenna: quest("Slumbering Wolf's Shack", "Latenna, once you have Albus's half of the medallion"),
  Seluvis: quest("Ranni's Rise", "Preceptor Seluvis's quest (or kill him)"),
  'Pidia- Carian Servant': quest(
    "Ranni's Rise",
    "Seluvis's puppets, after you give Nepheli his potion",
  ),
  'Blaidd is the Half-Wolf': quest("Ranni's Rise", "Blaidd, late in Ranni's quest"),
  'Corpse - Blaidd is the Half-Wolf': quest("Ranni's Rise", "Blaidd, late in Ranni's quest"),
  'Ranni the Witch': quest('Cathedral of Manus Celes', 'Ranni, at the end of her quest'),
  'War Counselor Iji': quest(
    'Road to the Manor',
    "War Counselor Iji (kill him, or late in Ranni's quest)",
  ),
  'Eleonora- Violet Bloody Finger': quest(
    'region:Altus Plateau',
    "Eleonora at the Second Church of Marika (Yura's quest)",
  ),
  'Bloody Finger Hunter Yura': quest(
    'region:Altus Plateau',
    'Yura, at the end of his quest by the Second Church of Marika (or kill him)',
  ),
  'Corpse - Bloody Finger Hunter Yura': quest(
    'region:Altus Plateau',
    'Yura, at the end of his quest by the Second Church of Marika (or kill him)',
  ),
  'Corpse - [Bloody Finger Hunter Yura': quest(
    'region:Altus Plateau',
    'Yura, at the end of his quest by the Second Church of Marika (or kill him)',
  ),
  'Iron Fist Alexander': quest(
    'Crumbling Beast Grave Depths',
    "Iron Fist Alexander's duel at the end of his quest",
  ),
  'Corpse - Iron Fist Alexander': quest(
    'Saintsbridge',
    'Kill Iron Fist Alexander (stuck in the ground in Stormhill)',
  ),
  Patches: quest('Murkwater Cave', 'Patches (his quest, or kill him)'),
  'Corpse - Patches': quest('Murkwater Cave', 'Patches (kill him)'),
  Roderika: quest('Stormhill Shack', 'Roderika'),
  Edgar: quest("Revenger's Shack", "Edgar, invading at the Revenger's Shack (Irina's quest)"),
  'Corpse - Edgar': quest(
    "Revenger's Shack",
    "Edgar, invading at the Revenger's Shack (Irina's quest)",
  ),
  'Knight Bernahl': quest(
    "Warmaster's Shack",
    "Knight Bernahl's Volcano Manor quest (the scepter and armor when you defeat him)",
  ),
  'Corpse - Knight Bernahl': quest("Warmaster's Shack", 'Knight Bernahl (defeat him)'),
  'Big Boggart': quest('Boilprawn Shack', 'Blackguard Big Boggart'),
  'Corpse - Big Boggart': quest('Boilprawn Shack', 'Blackguard Big Boggart (kill him)'),
  Gowry: quest('region:Caelid', "Gowry (Millicent's quest)"),
  'Corpse - Gowry': quest('region:Caelid', "Gowry (Millicent's quest)"),
  Millicent: quest('Haligtree Roots', "Millicent's quest (its last steps in Elphael)"),
  'Millicent - Killed Sisters': quest(
    'Haligtree Roots',
    'Millicent: fight with her against her sisters in Elphael',
  ),
  'Corpse - Millicent': quest('Haligtree Roots', 'Millicent: fight her in Elphael'),
  Fia: quest(ROUNDTABLE, "Fia's quest"),
  'Corpse - Fia': quest(ROUNDTABLE, "Fia's quest (or kill her)"),
  'Ensha of the Royal Remains': quest(ROUNDTABLE, "Ensha, at the end of Fia's quest"),
  'Sorcerer Rogier': quest(ROUNDTABLE, 'Sorcerer Rogier, at the end of his quest'),
  Thops: quest('Lake-Facing Cliffs', 'Sorcerer Thops at the Church of Irith'),
  'Corpse - Thops': quest('Schoolhouse Classroom', "Thops's body in the academy (his quest)"),
  'Brother Corhyn': quest(ROUNDTABLE, "Brother Corhyn (the end of Goldmask's quest, or kill him)"),
  'Corpse - Brother Corhyn': quest(
    ROUNDTABLE,
    "Brother Corhyn (the end of Goldmask's quest, or kill him)",
  ),
  Goldmask: quest('region:Leyndell, Ashen Capital', "Goldmask's body, at the end of his quest"),
  'Dung Eater': quest(ROUNDTABLE, "Dung Eater's quest"),
  'Corpse - Dung Eater': quest(ROUNDTABLE, 'Dung Eater (kill him)'),
  '103824': quest(ROUNDTABLE, "Dung Eater's quest"),
  'Nepheli Loux': quest(
    'Godrick the Grafted',
    'Nepheli Loux, once she rules Stormveil (her quest)',
  ),
  'Juno Hoslow': quest(
    'region:Mountaintops of the Giants',
    'Invade Juno Hoslow by the Shack of the Lofty (a Volcano Manor request)',
  ),
  'Corpse - Juno Hoslow': quest(
    'region:Mountaintops of the Giants',
    'Invade Juno Hoslow by the Shack of the Lofty (a Volcano Manor request)',
  ),
  'Jar Bairn': quest('Jarburg', "Jar Bairn's quest"),
  'The Great-Jar': quest("region:Greyoll's Dragonbarrow", 'The Great-Jar: beat its three knights'),
  'Gurranq - 1st Deathroot': quest('Bestial Sanctum', 'Gurranq, for the 1st Deathroot'),
  'Gurranq - 2nd Deathroot': quest('Bestial Sanctum', 'Gurranq, for the 2nd Deathroot'),
  'Gurranq - 3rd Deathroot': quest('Bestial Sanctum', 'Gurranq, for the 3rd Deathroot'),
  'Gurranq - 4th Deathroot': quest('Bestial Sanctum', 'Gurranq, for the 4th Deathroot'),
  'Gurranq - 5th Deathroot': quest('Bestial Sanctum', 'Gurranq, for the 5th Deathroot'),
  'Gurranq - 6th Deathroot': quest('Bestial Sanctum', 'Gurranq, for the 6th Deathroot'),
  'Gurranq - 7th Deathroot': quest('Bestial Sanctum', 'Gurranq, for the 7th Deathroot'),
  'Gurranq - 8th Deathroot': quest('Bestial Sanctum', 'Gurranq, for the 8th Deathroot'),
  'Lake or Rot - Astel': boss('Astel, Naturalborn of the Void', 'Astel, Naturalborn of the Void'),
  'Erdtree - Elden Beast': boss('Fractured Marika', 'Elden Beast'),
  "Omenkiller - Perfumer's Grotto": boss("Perfumer's Grotto", 'Omenkiller'),
  // Paintings: the reward waits where the painting points (detail says where the painting hangs).
  'Reward - "Homing Instinct" Painting': pickup(
    "Artist's Shack@Limgrave",
    '"Homing Instinct" painting reward',
  ),
  'Reward - "Prophecy" Painting': pickup(
    'Church of Pilgrimage',
    '"Prophecy" painting (in Stormveil): behind the church',
  ),
  'Reward - "Resurrection" Painting': pickup(
    'Behind Caria Manor',
    '"Resurrection" painting: the graveyard behind the manor',
  ),
  'Reward - "Champion\'s Song" Painting': pickup(
    'Rampartside Path',
    '"Champion\'s Song" painting (in the Shaded Castle): the cliff to the southwest',
  ),
  'Reward - "Redmane" Painting': pickup(
    'Fort Faroth',
    '"Redmane" painting (in Sellia): the cliffs northeast of the fort',
  ),
  'Reward - "Flightless Bird" Painting': pickup(
    'Windmill Heights',
    '"Flightless Bird" painting (in Leyndell): the cliff edge to the south',
  ),
  'Reward - "Sorcerer" Painting': pickup(
    'region:Liurnia of the Lakes',
    '"Sorcerer" painting (in Castle Sol): by a bridge northwest of the Stargazers\' Ruins',
  ),
  '80400': pickup('Greatbridge, North', '"Incursion" painting reward, to the west'),
  '80410': pickup(
    'Temple Town Ruins',
    '"Sacred Tower" painting reward, past the Northern Nameless Mausoleum',
  ),
  '80420': pickup(
    'Jagged Peak Mountainside',
    '"Domain of Dragons" painting reward, via the spiritspring',
  ),
  // Starting flasks.
  ...lots([2, 2000, 2001], { kind: 'start', at: null, detail: 'Every starting class' }),

  // --- Shadow of the Erdtree: bosses (unnamed lots) ---
  '10400': boss('Theatre of the Divine Beast', 'Divine Beast Dancing Lion'),
  '10420': boss('region:Enir-Ilim', "Needle Knight Leda (her quest's end)"),
  '10430': boss('Gate of Divinity', 'Promised Consort Radahn'),
  '10440': boss('Main Gate Plaza', 'Golden Hippopotamus'),
  '10460': boss('Dark Chamber Entrance', 'Messmer the Impaler'),
  '10480': boss('Fissure Depths', 'Putrescent Knight'),
  '10550': boss('Cathedral of Manus Metyr', 'Metyr, Mother of Fingers'),
  '10560': boss('Discussion Chamber', 'Midra, Lord of Frenzied Flame'),
  '10600': boss('Church of the Bud', 'Romina, Saint of the Bud'),
  '10610': boss('Darklight Catacombs', 'Jori, Elder Inquisitor'),
  ...lots([10620, 10621], boss('Scadutree Base', 'Scadutree Avatar')),
  '10640': boss('Shadow Keep, Back Gate', 'Commander Gaius'),
  '10900': boss("Castle-Lord's Chamber", 'Rellana, Twin Moon Knight'),
  ...lots([20700, 20701], boss('Fog Rift Catacombs', 'Death Knight')),
  ...lots([20710, 20711], boss('Scorpion River Catacombs', 'Death Knight')),
  '20750': boss('Belurat Gaol', 'Demi-Human Swordmaster Onze'),
  '20760': boss('Bonny Gaol', 'Curseblade Labirith'),
  '20770': boss("Lamenter's Gaol", 'Lamenter'),
  '20800': boss('Rivermouth Cave', 'Chief Bloodfiend'),
  '20810': boss("Dragon's Pit Terminus", 'Ancient Dragon-Man'),
  ...lots([30801, 30851], boss('region:Jagged Peak', 'Jagged Peak Drake')),
  ...lots(
    [30810, 30811, 30812, 30813, 30814],
    boss('region:Cerulean Coast', 'Dancer of Ranah (Southern Nameless Mausoleum)'),
  ),
  ...lots(
    [30820, 30821, 30822, 30823, 30824],
    boss('Scorched Ruins', 'Blackgaol Knight (Western Nameless Mausoleum)'),
  ),
  ...lots(
    [30830, 30831, 30832, 30833, 30834],
    boss("Recluses' River Downstream", 'Rakshasa (Eastern Nameless Mausoleum)'),
  ),
  '30845': boss("Charo's Hidden Grave", 'Demi-Human Queen Marigga'),
  '30855': boss("Charo's Hidden Grave", 'Death Rite Bird'),
  '30865': boss('region:Scadu Altus', 'Moonrithyll, Carian Knight'),
  ...lots(
    [30900, 30901, 30902, 30903, 30904],
    boss('region:Rauh Base', 'Red Bear (Northern Nameless Mausoleum)'),
  ),
  '30910': boss('region:Rauh Base', 'Rugalea the Great Red Bear'),
  '30930': boss('region:Scadu Altus', 'Ralva the Great Red Bear'),
  '30940': boss('Theatre of the Divine Beast', 'Divine Beast Dancing Lion'),
  '30955': boss('region:Scadu Altus', 'Black Knight Garrew (Fog Rift Fort)'),
  '30960': boss('region:Scadu Altus', 'Fallingstar Beast'),
  '30965': boss('Fort of Reprimand', 'Black Knight Edredd'),
  // Teardrop Scarabs.
  '40900': pickup('Cathedral of Manus Metyr', 'Teardrop Scarab in the cave to the southwest'),
  '40902': pickup('Moorth Ruins', 'Teardrop Scarab in the ruins to the southeast'),
  '40904': pickup(
    'region:Scadu Altus',
    'Teardrop Scarab over the camp south of the Shadow Keep gate',
  ),
  '40906': pickup(
    'Bridge Leading to the Village',
    'Teardrop Scarab in the forest to the northeast',
  ),
  '40910': pickup('Ancient Ruins Base', 'Teardrop Scarab on a pillar to the northeast'),
  '40916': pickup('region:Ancient Ruins of Rauh', 'Teardrop Scarab'),

  // --- Shadow of the Erdtree: quests (unnamed lots) ---
  ...lots(
    [105900],
    quest('Highroad Cross', 'Needle Knight Leda, after you help her against Hornsent'),
  ),
  ...lots(
    [105910],
    quest('Highroad Cross', 'Needle Knight Leda, after you help her against Ansbach'),
  ),
  '105920': quest('region:Enir-Ilim', 'Hornsent, if you side with him against Leda'),
  ...lots(
    [105921, 105931, 115900, 115910, 105940],
    quest('region:Enir-Ilim', 'Needle Knight Leda, at the end of her quest'),
  ),
  ...lots(
    [105930, 106214, 106234, 116204],
    quest('region:Enir-Ilim', 'Sir Ansbach, if you defend him from Leda'),
  ),
  ...lots(
    [
      106210, 106211, 106212, 106213, 106220, 106221, 106222, 106223, 106224, 106225, 106230,
      106231, 106232, 106233, 116200, 116201, 116202, 116203,
    ],
    quest('region:Enir-Ilim', "Sir Ansbach's body after the final boss (his quest)"),
  ),
  '106000': quest('Storehouse, Seventh Floor', "Redmane Freyja's quest"),
  ...lots(
    [106010, 106011, 106012, 106013, 106014, 116000, 116001, 116002, 116003, 116004],
    quest('region:Enir-Ilim', 'Redmane Freyja, at the end of her quest'),
  ),
  ...lots(
    [116100, 116101, 116102, 116103, 116104],
    quest('Three-Path Cross', 'Hornsent (kill him)'),
  ),
  ...lots([106310, 107400], quest('Pillar Path Cross', "Thiollier and St. Trina's quest")),
  ...lots(
    [106320, 106321, 106322, 106323, 106324, 106330, 106331, 106332, 106333],
    quest('region:Enir-Ilim', "Thiollier's body after the final boss (his quest)"),
  ),
  ...lots(
    [106421, 106422, 106423, 106424, 106425, 116401, 116402, 116403, 116404, 116405],
    quest('Main Gate Cross', 'Moore, at the end of his quest (or defeat his invasion)'),
  ),
  '106400': quest('Main Gate Cross', 'Moore, after you help one of the Forager Brood'),
  '107500': quest('Ruined Forge of Starfall Past', "A Forager Brood nearby (Moore's quest)"),
  '107530': quest('Cliffroad Terminus', "A Forager Brood nearby (Moore's quest)"),
  '107540': quest(
    'region:Scadu Altus',
    "A Forager Brood at the foot of the cliffs (Moore's quest)",
  ),
  '107550': quest(
    'region:Gravesite Plain',
    "The shivering Forager Brood at the end of the Ellac River: warm it (Moore's quest)",
  ),
  '107510': quest(
    'Moorth Ruins',
    "A Forager Brood in the poison swamp through the tunnel to the northeast (Moore's quest)",
  ),
  '107520': quest(
    'region:Scadu Altus',
    "The Kindred of Rot east of the Shadow Keep (Moore's quest)",
  ),
  ...lots(
    [106611, 106631, 106641, 106642, 106643, 106644, 106645, 106650],
    quest('Cathedral of Manus Metyr', "Count Ymir's quest"),
  ),
  ...lots(
    [
      106700, 106710, 106720, 107600, 107610, 107620, 107630, 107640, 107650, 107660, 107670,
      107680, 107690, 107700, 107800, 107810, 107820, 107830, 107840, 107850, 107860, 107870,
      107880, 107890, 107900,
    ],
    quest('Cathedral of Manus Metyr', "Swordhand of Night Jolán, at the end of Count Ymir's quest"),
  ),
  '106920': quest('Belurat, Tower Settlement', 'Fire Knight Queelign: defeat his invasion'),
  '106930': quest(
    'region:Scadu Altus',
    'Fire Knight Queelign: defeat his invasion at the Church of the Crusade',
  ),
  ...lots(
    [106900, 106910],
    quest('region:Shadow Keep, Church District', "Fire Knight Queelign's body (his quest)"),
  ),
  ...lots(
    [107000, 107010, 107020, 107030, 107031],
    quest(
      'Grand Altar of Dragon Communion',
      'Dragon Communion Priestess, after Bayle the Dread (her quest)',
    ),
  ),
  ...lots(
    [
      107111, 107112, 107113, 107114, 107115, 107120, 107121, 107122, 107123, 107124, 107125,
      117101, 117102, 117103, 117104, 117105, 117106,
    ],
    quest('Jagged Peak Summit', 'Igon, after Bayle the Dread (his quest)'),
  ),
  ...lots(
    [107200, 107210, 107211],
    quest(
      'Belurat, Tower Settlement',
      'Hornsent Grandam in the storeroom (wear the Divine Beast Head)',
    ),
  ),
  ...lots(
    [107220, 107230],
    quest('Belurat, Tower Settlement', 'Hornsent Grandam in the storeroom, after Messmer', {
      requires: ['messmer'],
    }),
  ),
  ...lots([107300, 107301, 107310], quest('Moorth Ruins', 'Dryleaf Dane')),
};

/** Sources the params don't have. */
export const EXTRA_SOURCES: AcquisitionInputs['extraSources'] = {
  'consumables:Memory of Grace': [{ kind: 'start', at: null, detail: 'Every starting class' }],
  // Keepsakes: one is chosen at character creation.
  'consumables:Lands Between Rune': [{ kind: 'start', at: null, detail: 'Keepsake' }],
  'talismans:Crimson Amber Medallion': [{ kind: 'start', at: null, detail: 'Keepsake' }],
  "talismans:Shabriri's Woe": [{ kind: 'start', at: null, detail: 'Keepsake' }],
  'spiritAshes:Fanged Imp Ashes': [{ kind: 'start', at: null, detail: 'Keepsake' }],
  'consumables:Bewitching Branch': [{ kind: 'start', at: null, detail: 'Keepsake' }],
  'consumables:Boiled Prawn': [{ kind: 'start', at: null, detail: 'Keepsake' }],
  // The Chapel of Anticipation has no Site of Grace, so its lots can't be placed by ID.
  "consumables:Tarnished's Wizened Finger": [
    {
      kind: 'pickup',
      at: 'region:Stranded Graveyard',
      detail: 'Chapel of Anticipation, at the start',
    },
  ],
  'spiritAshes:Stormhawk Deenh': [
    {
      kind: 'pickup',
      at: 'region:Stranded Graveyard',
      detail: 'Chapel of Anticipation, on a return trip through the Four Belfries waygate',
    },
  ],
  'consumables:Small Golden Effigy': [
    { kind: 'pickup', at: 'region:Limgrave', detail: 'Next to a Martyr Effigy (summoning statue)' },
  ],
  // The lot hands out the plain bow; the ash comes attached when Igon fought Bayle with you.
  "ashesOfWar:Ash of War: Igon's Drake Hunt": [
    {
      kind: 'quest',
      at: 'Jagged Peak Summit',
      detail: "On Igon's Greatbow from Igon's body, if you summoned him against Bayle",
    },
  ],
  // A gathered material (gathering spots aren't item lots).
  'consumables:Roundrock': [
    { kind: 'pickup', at: 'Ellac River Cave', detail: 'Gathered from river banks and river caves' },
  ],
};

/** Items a normal game can't get, and why. */
export const NO_SOURCE: AcquisitionInputs['noSource'] = {
  'consumables:Phantom Bloody Finger': 'Multiplayer: only held while invading as a phantom',
  'consumables:Phantom Recusant Finger': 'Multiplayer: only held while invading as a phantom',
  'consumables:Phantom Great Rune': 'Multiplayer: only held as a phantom',
  // Obtainable by mistake in 1.02 only; patch 1.03 took it out again.
  'armor:Ragged Hat': 'Removed in patch 1.03 (it was only obtainable by mistake)',
  'armor:Ragged Armor': 'Removed in patch 1.03 (it was only obtainable by mistake)',
  'armor:Ragged Gloves': 'Removed in patch 1.03 (it was only obtainable by mistake)',
  'armor:Ragged Loincloth': 'Removed in patch 1.03 (it was only obtainable by mistake)',
  'armor:Ragged Hat (Altered)': 'Removed in patch 1.03 (it was only obtainable by mistake)',
  'armor:Ragged Armor (Altered)': 'Removed in patch 1.03 (it was only obtainable by mistake)',
};

/** Items whose facts aren't written yet (T19 finishes them before T15). Keep this list shrinking. */
// Generated from the gaps on 2026-11-15 (T14); mostly enemy farm spots, NPC/quest rewards and the DLC's
// unnamed boss lots. Remove an entry when its fact lands (the pipeline fails on a stale entry).
export const PENDING_FACTS: AcquisitionInputs['pending'] = [];
