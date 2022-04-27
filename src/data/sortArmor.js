const fs = require('fs');
const armorData = require('./armor.json');

const data = {
  helms: {},
  chests: {},
  gauntlets: {},
  legs: {},
};

armorData.helms.forEach((item) => {
  data.helms[item.name] = item;
});

armorData.chests.forEach((item) => {
  data.chests[item.name] = item;
});

armorData.gauntlets.forEach((item) => {
  data.gauntlets[item.name] = item;
});

armorData.legs.forEach((item) => {
  data.legs[item.name] = item;
});

const json = JSON.stringify(data, null, 2);
fs.writeFileSync('./armorIndexed.json', json);
