import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const SPELLS_URL = 'https://rankedboost.com/elden-ring/spells/';

const run = async () => {
  const response = await fetch(SPELLS_URL);
  const body = await response.text();
  const html = cheerio.load(body);
  const elements = Array.from(html('#Spells_Table_Body_List > tr'));

  const spells = [];

  elements.forEach(element => {
    const [tier, name, type, fp, slot, int, fai, arc, effect] = Array.from(element.childNodes);
    const newItem = {};
    newItem.name = html('.tier-list-object-name-table-css', name).text() || '';
    newItem.type = html(type).text() || '';
    newItem.subType = html('.spell-type', name).text() || '';
    newItem.tier = html(tier).text() || '';
    newItem.fp = html(fp).text() || '';
    newItem.slot = html(slot).text() || '';
    newItem.int = html(int).text() || '';
    newItem.fai = html(fai).text() || '';
    newItem.arc = html(arc).text() || '';
    newItem.effect = html(effect).text() || '';
    const imageUrl = html('.tier-list-table-object-image', name).attr('src') || '';
    newItem.imageUrl = imageUrl.split('assets')[1];

    Object.keys(newItem).forEach(key => {
      newItem[key] = newItem[key].trim();
    });

    spells.push(newItem);
  });

  const json = JSON.stringify(spells, null, 2);
  fs.writeFileSync('./spells.json', json);
};

run();
