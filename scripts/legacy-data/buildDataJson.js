import fs from 'fs';
import armor from './armor.json';
import arrowsAndBolts from './arrowsAndBolts.json';
import consumables from './consumables.json';
import materials from './materials.json';
import skills from './skills.json';
import spells from './spells.json';
import spirits from './spirits.json';
import talismans from './talismans.json';
import tears from './tears.json';
import weapons from './weapons.json';

const data = {
  armor,
  arrowsAndBolts,
  consumables,
  materials,
  skills,
  spells,
  spirits,
  talismans,
  tears,
  weapons,
};

const json = JSON.stringify(data, null, 2);
fs.writeFileSync('./data.json', json);
