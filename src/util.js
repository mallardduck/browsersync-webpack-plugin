const path = require('path');

/**
 * @export
 * @param {array} userArray
 * @returns
 */
module.exports.uniq = userArray => {
	return Array.from(new Set(userArray));
};

/**
 * @export
 * @param {string} targetPath
 * @param {string} ancestorPath
 * @return {boolean}
 */
module.exports.pathHasAncestor = (targetPath, ancestorPath) => {
	const relativePath = path.relative(ancestorPath, targetPath);
	return relativePath.substr(0, 2) !== '..';
};

/**
 * @export
 * @param {string} dependency
 * @param {any} [fallback]
 * @return {any}
 */
module.exports.desire = (dependency, fallback) => {
	try {
		require.resolve(dependency);
	} catch (err) {
		return fallback;
	}
	return require(dependency); // eslint-disable-line import/no-dynamic-require
};
