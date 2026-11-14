import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const MATERIALS_URL = 'https://rankedboost.com/elden-ring/materials/';

const run = async () => {
  const response = await fetch(MATERIALS_URL);
  const body = await response.text();
  const html = cheerio.load(body);
  const elements = Array.from(html('#Materials_Table_Body_List > tr'));

  const materials = [];

  elements.forEach(element => {
    const [name] = Array.from(element.childNodes);
    const newItem = {};
    newItem.name = html('.tier-list-object-name-table-css', name).text() || '';
    const imageUrl = html('.tier-list-table-object-image', name).attr('src') || '';
    newItem.imageUrl = imageUrl.split('assets')[1];

    Object.keys(newItem).forEach(key => {
      newItem[key] = newItem[key].trim();
    });

    materials.push(newItem);
  });

  const json = JSON.stringify(materials, null, 2);
  fs.writeFileSync('./materials.json', json);
};

run();
