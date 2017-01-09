const mergeWith = require('lodash.mergewith');

/**
 * @export
 * @param {object} ...elements
 * @returns {object}
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
  return Array.from(new Set(userArray));
};

/**
 * @export
 * @param {string} dependency
 * @param {any} [fallback]
 * @return {any}
 */
module.exports.desire = (dependency, fallback) => {
  try { require.resolve(dependency); } catch (e) { return fallback; }
  return require(dependency);
};
