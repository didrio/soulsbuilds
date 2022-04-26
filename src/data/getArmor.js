import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const ARMOR_URL = 'https://rankedboost.com/elden-ring/armor/';

const run = async () => {
  const response = await fetch(ARMOR_URL);
  const body = await response.text();
  const html = cheerio.load(body);
  const elements = Array.from(html('#Armor_Table_Body_List > tr'));

  const armor = {
    helms: [],
    legs: [],
    chests: [],
    gauntlets: [],
  };

  elements.forEach((element) => {
    const [tier, name, type, weight, physical, slash, strike, pierce, magic, fire, light, holy] = Array.from(element.childNodes);
    const newItem = {};
    newItem.name = html('.tier-list-object-name-table-css', name).text() || '';
    newItem.type = html('.weapon-type-list-div-css', type).text() || '';
    newItem.tier = html(tier).text() || '';
    newItem.passive = html('.tier-list-object-name-table-css-passive', name).text() || '';
    const imageUrl = html('.tier-list-table-object-image', name).attr('src') || '';
    newItem.imageUrl = imageUrl.split('assets')[1];
    newItem.set = html('.set-type-list-div-css', type).text() || '';
    newItem.weight = html('b', weight).text() || '';
    newItem.weightType = html('.set-type-weight-list-div-css', weight).text() || '';
    newItem.physical = html(physical).text() || '';
    newItem.slash = html(slash).text() || '';
    newItem.strike = html(strike).text() || '';
    newItem.pierce = html(pierce).text() || '';
    newItem.magic = html(magic).text() || '';
    newItem.fire = html(fire).text() || '';
    newItem.light = html(light).text() || '';
    newItem.holy = html(holy).text() || '';

    Object.keys(newItem).forEach((key) => {
      newItem[key] = newItem[key].trim();
    });

    switch (newItem.type) {
      case 'Helm':
        armor.helms.push(newItem);
        break;
      case 'Leg':
        armor.legs.push(newItem);
        break;
      case 'Chest':
        armor.chests.push(newItem);
        break;
      case 'Gauntlet':
        armor.gauntlets.push(newItem);
        break;
      default:
        break;
    }
  });

  const json = JSON.stringify(armor, null, 2);
  fs.writeFileSync('./armor.json', json);
};

run();
