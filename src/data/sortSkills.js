const fs = require('fs');
const skillsData = require('./skills.json');

const data = {};

skillsData.forEach((item) => {
  data[item.name] = item;
});

const json = JSON.stringify(data, null, 2);
fs.writeFileSync('./skillsIndexed.json', json);
