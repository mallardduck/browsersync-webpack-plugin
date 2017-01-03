const mergeWith = require('lodash.mergewith');

/**
 * @export
 * @returns
 */
module.exports.merge = (...elements) => {
  elements.push((a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.concat(b);
    }
    return undefined;
  });
  return mergeWith.apply(this, elements);
};

/**
 * @export
 * @param {array} userArray
 * @returns
 */
module.exports.uniq = (userArray) => {
  const unique = {};
  userArray.forEach((unusedValue, index) => { unique[userArray[index]] = true; });
  return Object.keys(unique);
};
