/* The three test builds for the build page. Gear, stats and routes come from data-loadouts.js (game data);
   names, grades, analysis text, notes and comments here are sample content written for the mock-up. */
window.META = {
  full: {
    name: 'Night and Flame Spellblade', sig: 'magic', sigLabel: 'Magic · Int / Fai', mode: 'PvP', author: 'Souls Builds',
    art: 10053, tags: ['Intelligence', 'Faith', 'Straight Sword', 'Glintstone Staff'], likes: 87, done: 8,
    credit: 'Recreated by Souls Builds from “Death Knight” on the Fextralife wiki. For this test every other slot is filled too.',
    notes: [
      ['How it plays', 'The sword’s skill, Night-and-Flame Stance, fires a magic beam or a fire sweep, depending on which attack you press after it. Either one takes a large chunk of a boss’s health. Use it when a boss leaves an opening, then swing the sword normally while your FP recovers.'],
      ['Stats', '66 Intelligence for the sword and the sorceries. 25 Faith covers Golden Vow. 50 Vigor, 25 Mind for skill and spell use, 30 Endurance for the armor.'],
    ],
    tip: null,
    analysis: {
      grade: 'B', mode: 'PvP', ease: 'Takes practice', title: 'Ranged burst, heavy roll',
      summary: 'Night-and-Flame Stance and Comet Azur hit hard from range, but at 59 of 78 load this build heavy-rolls, and at level 150 that is a big opening for faster opponents.',
      scores: [
        ['Bracket fit', 7, 'Level 150 with 66 Intelligence: the damage stats are where they should be, but 25 Faith only buys Golden Vow.', ['Lv 150', 'Int 66', 'Fai 25']],
        ['Survivability', 6, 'HP is fine for the bracket and poise is high, but the heavy roll is slow to get out of pressure.', ['HP 1,704', 'Poise 66', 'Heavy roll · 76% load']],
        ['Toolkit', 9, 'Long-range burst (the stance’s beam, Comet Azur), a fast cast with Glintstone Pebble, a shield with Carian Retaliation and Golden Vow for buffs.', ['Comet Azur', 'Night-and-Flame Stance', 'Carian Retaliation']],
        ['Counterplay', 5, 'Experienced players bait the stance and punish its recovery; a quick bleed weapon up close is hard to escape at this weight.', ['Long recovery', 'Heavy roll']],
      ],
      playsLike: 'Keep distance, punish openings with the stance’s beam, and save Comet Azur for a staggered or trapped opponent.',
      strengths: ['Huge burst from range', 'Answers to most ranges', 'High poise for a caster'],
      weaknesses: ['Heavy roll at this load', 'Stance and Comet Azur are easy to bait'],
      journey: null,
      raise: 'Drop the Night’s Cavalry Armor for a lighter chest to reach a medium roll; poise falls, but you stop getting caught.',
      levels: null,
    },
    comments: [
      { who: 'glintstone_gay', when: '6 hours ago', likes: 12, text: 'At 150 in duels the heavy roll gets you killed. Swapped the chest and it feels much better.', reply: { who: 'Souls Builds', when: '2 hours ago', text: 'Agreed. That’s the analysis’s suggestion too.' } },
      { who: 'PvEPatches', when: '1 day ago', likes: 4, text: 'Comet Azur in invasions is mostly a bait for a backstab, in my experience.' },
    ],
  },
  half: {
    name: 'Rivers of Blood Bleed Samurai', sig: 'blood', sigLabel: 'Bleed · Dex / Arc', mode: 'PvE', author: 'Souls Builds',
    art: 10324, tags: ['Dexterity', 'Arcane', 'Bleed', 'Katana'], likes: 214, done: 3,
    credit: 'Recreated by Souls Builds from “Sanguine Samurai” on the Fextralife wiki. The source didn’t give exact stats or armor, so those are ours. For this test, five spells were added.',
    notes: 'ROB', tip: 'If you run out of stamina, swap the Crest for the Green Turtle Talisman.',
    analysis: 'ROB', comments: 'ROB',
  },
  sparse: {
    name: 'Lordsworn’s Greatsword Starter', sig: 'physical', sigLabel: 'Physical · Str', mode: 'PvE', author: 'tarnished_tom',
    art: 10083, tags: ['Strength', 'Greatsword'], likes: 6, done: 1,
    credit: null, notes: null, tip: null,
    analysis: {
      grade: 'C', mode: 'PvE', ease: 'Easy to play', title: 'A start, not a build yet',
      summary: 'A Heavy Lordsworn’s Greatsword with Golden Vow is a sound early plan, but with no talismans, no spells and half the armor slots empty there is little here past the first regions.',
      scores: [
        ['Damage', 5, 'Heavy affinity suits 25 Strength, and Golden Vow adds a little, but nothing else raises damage.', ['Str 25', 'Heavy', 'Golden Vow']],
        ['Synergy', 4, 'The pieces don’t work against each other; there just aren’t many of them.', ['3 items']],
        ['Survivability', 5, 'Low HP for level 50 with Vigor at 26; two Banished Knight pieces give some poise.', ['HP 833', 'Poise 45']],
        ['Range', 6, 'Both pieces are early, so it works from the first hours, but it needs more to carry into the late game.', ['Limgrave', 'Caelid']],
      ],
      playsLike: 'Two-hand the greatsword, buff with Golden Vow before big fights, and trade hits where your poise holds.',
      strengths: ['Everything is early and easy to get', 'Simple to play'],
      weaknesses: ['No talismans or spells', 'Low Vigor for level 50'],
      journey: null,
      raise: 'Add four talismans you can get early: Erdtree’s Favor, Claw Talisman, Green Turtle and Great-Jar’s Arsenal later.',
      levels: null,
    },
    comments: [],
  },
};
