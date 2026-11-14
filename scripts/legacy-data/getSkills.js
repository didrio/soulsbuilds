import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const SKILLS_URL = 'https://rankedboost.com/elden-ring/skills/';

const run = async () => {
  const response = await fetch(SKILLS_URL);
  const body = await response.text();
  const html = cheerio.load(body);
  const elements = Array.from(html('#Spirits_Table_Body_List > tr'));

  const skills = [];

  elements.forEach(element => {
    const [tier, name, how, fp, effect] = Array.from(element.childNodes);
    const newItem = {};
    newItem.name = html('.tier-list-object-name-table-css', name).text() || '';
    newItem.type = html('.skill-type-div-for-er', name).text() || '';
    newItem.tier = html(tier).text() || '';
    newItem.fp = html(fp).text() || '';
    newItem.effect = html(effect).text() || '';

    Object.keys(newItem).forEach(key => {
      newItem[key] = newItem[key].trim();
    });

    skills.push(newItem);
  });

  const json = JSON.stringify(skills, null, 2);
  fs.writeFileSync('./skills.json', json);
};

run();
