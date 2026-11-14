import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const SPIRITS_URL = 'https://rankedboost.com/elden-ring/spirits/';

const run = async () => {
  const response = await fetch(SPIRITS_URL);
  const body = await response.text();
  const html = cheerio.load(body);
  const elements = Array.from(html('#Spirits_Table_Body_List > tr'));

  const spirits = [];

  elements.forEach(element => {
    const [tier, name, fp, effect, damageType] = Array.from(element.childNodes);
    const newItem = {};
    newItem.name = html('.tier-list-object-name-table-css', name).text() || '';
    newItem.damageType = html(damageType).text() || '';
    newItem.tier = html(tier).text() || '';
    newItem.fp = html(fp).text() || '';
    newItem.effect = html(effect).text() || '';
    const imageUrl = html('.tier-list-table-object-image', name).attr('src') || '';
    newItem.imageUrl = imageUrl.split('assets')[1];

    Object.keys(newItem).forEach(key => {
      newItem[key] = newItem[key].trim();
    });

    spirits.push(newItem);
  });

  const json = JSON.stringify(spirits, null, 2);
  fs.writeFileSync('./spirits.json', json);
};

run();
