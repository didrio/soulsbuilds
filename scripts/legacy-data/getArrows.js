import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const ARROWS_URL = 'https://rankedboost.com/elden-ring/arrows-and-bolts/';

const run = async () => {
  const response = await fetch(ARROWS_URL);
  const body = await response.text();
  const html = cheerio.load(body);
  const elements = Array.from(html('#Items_Table_Body_List > tr'));

  const arrows = [];

  elements.forEach(element => {
    const [name, effect] = Array.from(element.childNodes);
    const newItem = {};
    newItem.name = html(name).text() || '';
    const imageUrl = html('.tier-list-table-object-image', name).attr('src') || '';
    newItem.imageUrl = imageUrl.split('assets')[1];
    newItem.effect = html(effect).text() || '';

    Object.keys(newItem).forEach(key => {
      newItem[key] = newItem[key].trim();
    });

    arrows.push(newItem);
  });

  const json = JSON.stringify(arrows, null, 2);
  fs.writeFileSync('./arrowsAndBolts.json', json);
};

run();
