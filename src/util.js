import path from 'path';
import mergeWith from 'lodash.mergewith';

/**
 * @export
 * @param {object} ...elements
 * @returns {object}
 */
export const merge = (...elements) => {
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
export const uniq = userArray => {
	return Array.from(new Set(userArray));
};

/**
 * @export
 * @param {string} targetPath
 * @param {string} ancestorPath
 * @return {boolean}
 */
export const pathHasAncestor = (targetPath, ancestorPath) => {
	const relativePath = path.relative(ancestorPath, targetPath);
	return relativePath.substr(0, 2) !== '..';
};

/**
 * @export
 * @param {string} dependency
 * @param {any} [fallback]
 * @return {any}
 */
export const desire = (dependency, fallback) => {
	try {
		require.resolve(dependency);
	} catch (err) {
		return fallback;
	}
	return require(dependency); // eslint-disable-line import/no-dynamic-require
};

export default { merge, uniq, pathHasAncestor, desire };
