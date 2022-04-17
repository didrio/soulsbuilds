const elements = Array.from(document.querySelectorAll('#Armor_Table_Body_List > tr'));

const items = [];

elements.forEach(element => {
  const [tier, name, type, weight, physical, slash, strike, pierce, magic, fire, light, holy] = Array.from(element.children);
  const newItem = {};
  newItem.tier = tier.outerText;
  newItem.name = name.querySelector('.tier-list-object-name-table-css').outerText;
  newItem.passive = name.querySelector('.tier-list-object-name-table-css-passive').outerText || '';
  newItem.type = type.querySelector('.weapon-type-list-div-css').outerText;
  newItem.set = type.querySelector('.set-type-list-div-css').outerText || '';
  newItem.weight = weight.querySelector('b').outerText;
  newItem.weightType = weight.querySelector('.set-type-weight-list-div-css').outerText;
  newItem.physical = physical.outerText;
  newItem.slash = slash.outerText;
  newItem.strike = strike.outerText;
  newItem.pierce = pierce.outerText;
  newItem.magic = magic.outerText;
  newItem.fire = fire.outerText;
  newItem.light = light.outerText;
  newItem.holy = holy.outerText;
  items.push(newItem);
});

console.log(JSON.stringify(items, null, 2));