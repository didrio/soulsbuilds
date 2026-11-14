import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const TEARS_URL = 'https://rankedboost.com/elden-ring/crystal-tear/';

const run = async () => {
  const response = await fetch(TEARS_URL);
  const body = await response.text();
  const html = cheerio.load(body);
  const elements = Array.from(html('#Items_Table_Body_List > tr'));

  const tears = [];

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

    tears.push(newItem);
  });

  const json = JSON.stringify(tears, null, 2);
  fs.writeFileSync('./tears.json', json);
};

run();
