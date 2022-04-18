import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const WEAPONS_URL = 'https://rankedboost.com/elden-ring/weapons/';

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let counter = 100;

const run = async () => {
  const response = await fetch(WEAPONS_URL);
  const body = await response.text();
  const html = cheerio.load(body);
  const elements = Array.from(html('#Weapons_Table_Body_List > tr'));

  const weapons = {
    greatswords: [],
    twinblades: [],
    lightBows: [],
    colossalWeapons: [],
    crossbows: [],
    colossalSwords: [],
    greatBows: [],
    katanas: [],
    greatSpears: [],
    curvedGreatswords: [],
    hammers: [],
    straightSwords: [],
    reapers: [],
    glintstoneStaffs: [],
    sacredSeals: [],
    flails: [],
    warhammers: [],
    daggers: [],
    spears: [],
    heavyThrustingSwords: [],
    curvedSwords: [],
    whips: [],
    greatAxes: [],
    halberds: [],
    axes: [],
    fists: [],
    thrustingSwords: [],
    torchs: [],
    claws: [],
    ballistas: [],
  };
  
  await Promise.all(elements.map(async element => {
    const [tier, name, type, scaling, skill, weight, physical, magic, fire, light, holy] = Array.from(element.childNodes);
    const newItem = {};
    newItem.name = html('.tier-list-object-name-table-css', name).text() || '';
    newItem.type = html('.weapon-type-list-div-css', type).text() || '';
    newItem.damageType = html('.damage-type-list-div-css', type).text() || '';
    newItem.tier = html(tier).text() || '';
    newItem.passive = html('.tier-list-object-name-table-css-passive', name).text() || '';
    const imageUrl = html('.tier-list-table-object-image', name).attr('src') || '';
    newItem.imageUrl = imageUrl.split('assets')[1];
    newItem.skill = html(skill).text() || '';
    newItem.weight = html(weight).text() || '';
    newItem.physical = html(physical).text() || '';
    newItem.magic = html(magic).text() || '';
    newItem.fire = html(fire).text() || '';
    newItem.light = html(light).text() || '';
    newItem.holy = html(holy).text() || '';

    const scalingChildren = Array.from(scaling.childNodes);
    newItem.arc = '';
    newItem.dex = '';
    newItem.fai = '';
    newItem.int = '';
    newItem.str = '';
    scalingChildren.forEach(child => {
      const text = (html(child).text() || '').trim();
      if (text.includes('Arc')) {
        newItem.arc = text.charAt(text.length - 1) || '';
      } else if (text.includes('Dex')) {
        newItem.dex = text.charAt(text.length - 1) || '';
      } else if (text.includes('Fai')) {
        newItem.fai = text.charAt(text.length - 1) || '';
      } else if (text.includes('Int')) {
        newItem.int = text.charAt(text.length - 1) || '';
      } else if (text.includes('Str')) {
        newItem.str = text.charAt(text.length - 1) || '';
      }
    });

    const itemLink = html('.card-deck-a', name).attr('href');
    if (itemLink.startsWith('http')) {
      counter += 100;
      await timeout(counter);
      const response2 = await fetch(itemLink);
      const body2 = await response2.text();
      const html2 = cheerio.load(body2);
      const row = Array.from(html2('table.stats-and-details-table-css > tbody > tr'))[1];
      const [, strReq, dexReq, intReq, faiReq, arcReq] = Array.from(row.childNodes);
      newItem.strReq = html(strReq).text() || '';
      newItem.dexReq = html(dexReq).text() || '';
      newItem.intReq = html(intReq).text() || '';
      newItem.faiReq = html(faiReq).text() || '';
      newItem.arcReq = html(arcReq).text() || '';
    }

    Object.keys(newItem).forEach(key => {
      newItem[key] = newItem[key].trim();
    });

    if (newItem.type === 'Twinblades') {
      newItem.type = 'Twinblade';
    }

    if (newItem.type === 'Torchs') {
      newItem.type = 'Torch';
    }

    switch (newItem.type) {
      case 'Greatsword':
        weapons.greatswords.push(newItem);
        break;
      case 'Twinblade':
        weapons.twinblades.push(newItem);
        break;
      case 'Light Bow':
        weapons.lightBows.push(newItem);
        break;
      case 'Colossal Weapon':
        weapons.colossalWeapons.push(newItem);
        break;
      case 'Crossbow':
        weapons.crossbows.push(newItem);
        break;
      case 'Colossal Sword':
        weapons.colossalSwords.push(newItem);
        break;
      case 'Great Bow':
        weapons.greatBows.push(newItem);
        break;
      case 'Katana':
        weapons.katanas.push(newItem);
        break;
      case 'Great Spear':
        weapons.greatSpears.push(newItem);
        break;
      case 'Curved Greatsword':
        weapons.curvedGreatswords.push(newItem);
        break;
      case 'Hammer':
        weapons.hammers.push(newItem);
        break;
      case 'Straight Sword':
        weapons.straightSwords.push(newItem);
        break;
      case 'Reaper':
        weapons.reapers.push(newItem);
        break;
      case 'Glintstone Staff':
        weapons.glintstoneStaffs.push(newItem);
        break;
      case 'Sacred Seal':
        weapons.sacredSeals.push(newItem);
        break;
      case 'Flail':
        weapons.flails.push(newItem);
        break;
      case 'Warhammer':
        weapons.warhammers.push(newItem);
        break;
      case 'Dagger':
        weapons.daggers.push(newItem);
        break;
      case 'Spear':
        weapons.spears.push(newItem);
        break;
      case 'Heavy Thrusting Sword':
        weapons.heavyThrustingSwords.push(newItem);
        break;
      case 'Curved Sword':
        weapons.curvedSwords.push(newItem);
        break;
      case 'Whip':
        weapons.whips.push(newItem);
        break;
      case 'Great Axe':
        weapons.greatAxes.push(newItem);
        break;
      case 'Halberd':
        weapons.halberds.push(newItem);
        break;
      case 'Axe':
        weapons.axes.push(newItem);
        break;
      case 'Fist':
        weapons.fists.push(newItem);
        break;
      case 'Thrusting Sword':
        weapons.thrustingSwords.push(newItem);
        break;
      case 'Torch':
        weapons.torchs.push(newItem);
        break;
      case 'Claw':
        weapons.claws.push(newItem);
        break;
      case 'Ballista':
        weapons.ballistas.push(newItem);
        break;
      default:
        break;
    }
  }));
  
  const json = JSON.stringify(weapons, null, 2);
  fs.writeFileSync('./weapons.json', json);
};

run();
