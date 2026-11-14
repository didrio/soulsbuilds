import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const SMALL_SHIELDS_URL = 'https://rankedboost.com/elden-ring/small-shield/';
const MEDIUM_SHIELDS_URL = 'https://rankedboost.com/elden-ring/medium-shield/';
const GREAT_SHIELDS_URL = 'https://rankedboost.com/elden-ring/great-shield/';

const URLS = [
  SMALL_SHIELDS_URL,
  MEDIUM_SHIELDS_URL,
  GREAT_SHIELDS_URL,
];

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let counter = 100;

const run = async () => {
  const shields = {
    small: [],
    medium: [],
    great: []
  };

  await Promise.all(URLS.map(async url => {
    const response = await fetch(url);
    const body = await response.text();
    const html = cheerio.load(body);
    const elements = Array.from(html('#Weapons_Table_Body_List > tr'));
    
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
  
      switch (newItem.type) {
        case 'Small Shield':
          shields.small.push(newItem);
          break;
        case 'Medium Shield':
          shields.medium.push(newItem);
          break;
        case 'Great Shield':
          shields.great.push(newItem);
          break;
        default:
          break;
      }
    }));
  }));
  
  const json = JSON.stringify(shields, null, 2);
  fs.writeFileSync('./shields.json', json);
};

run();
