const fs = require('fs');
const flatten = require('lodash/flatten');
const shieldsData = require('./shields.json');
const weaponsData = require('./weapons.json');

const shieldsAndWeaponsData = ([
  ...flatten(Object.values(shieldsData)),
  ...flatten(Object.values(weaponsData)),
]);

const data = {};

shieldsAndWeaponsData.forEach((item) => {
  data[item.name] = item;
});

const json = JSON.stringify(data, null, 2);
fs.writeFileSync('./weaponsAndShields.json', json);
