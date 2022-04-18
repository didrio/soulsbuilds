import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const TALISMANS_URL = 'https://rankedboost.com/elden-ring/talismans/';

const run = async () => {
  const response = await fetch(TALISMANS_URL);
  const body = await response.text();
  const html = cheerio.load(body);
  const elements = Array.from(html('#Talisman_Table_Body_List > tr'));

  const talismans = [];

  elements.forEach((element) => {
    const [tier, name, effect] = Array.from(element.childNodes);
    const newItem = {};
    newItem.name = html(name).text() || '';
    newItem.tier = html(tier).text() || '';
    newItem.effect = html(effect).text() || '';
    const imageUrl = html('.tier-list-table-object-image', name).attr('src') || '';
    // eslint-disable-next-line prefer-destructuring
    newItem.imageUrl = imageUrl.split('assets')[1];

    Object.keys(newItem).forEach((key) => {
      newItem[key] = newItem[key].trim();
    });

    talismans.push(newItem);
  });

  const json = JSON.stringify(talismans, null, 2);
  fs.writeFileSync('./talismans.json', json);
};

run();
