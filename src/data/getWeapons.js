const elements = Array.from(document.querySelectorAll('#Weapons_Table_Body_List > tr'));

const items = [];

elements.forEach(element => {
  const [tier, name, type, scaling, skill, weight] = Array.from(element.children);
  const newItem = {};
  newItem.tier = tier.outerText;
  newItem.name = name.querySelector('.tier-list-object-name-table-css').outerText;
  newItem.passive = name.querySelector('.tier-list-object-name-table-css-passive').outerText || '';
  newItem.type = type.querySelector('.weapon-type-list-div-css').outerText;
  newItem.damageType = type.querySelector('.damage-type-list-div-css').outerText || '';
  newItem.weight = weight.outerText;
  // const scalingChildren = Array.from(scaling.children);
  // scalingChildren.forEach(scalingChild => {
  //   const text = scalingChild.outerText;
  //   if (text.contains('Str')) {
  //     newItem.strengthScaling
  //   }
  //   console.log(scalingChild.outerText);
  //   console.log(scalingChild.querySelector('b').outerText);
  // });
  // newItem.weight = weight.querySelector('b').outerText;
  // newItem.weightType = weight.querySelector('.set-type-weight-list-div-css').outerText;
  // newItem.physical = physical.outerText;
  // newItem.slash = slash.outerText;
  // newItem.strike = strike.outerText;
  // newItem.pierce = pierce.outerText;
  // newItem.magic = magic.outerText;
  // newItem.fire = fire.outerText;
  // newItem.light = light.outerText;
  // newItem.holy = holy.outerText;
  items.push(newItem);
});

console.log(JSON.stringify(items, null, 2));