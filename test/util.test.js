/* eslint-env jest */

import { merge, uniq, pathHasAncestor, desire } from '../src/util'; // eslint-disable-line no-unused-vars

describe('Utils', () => {
	describe('merge()', () => {
    /** setup */
		const dataset = { str: 'foo', arr: ['foo', 'bar'], obj: { foo: 'bar' } };
		const append = { arr: ['biz', 'baz'] };
		const final = dataset;
		final.arr.concat(append.arr);

    /** tests */
		test('should concatenate nested arrays', () => {
			expect(merge(dataset, append)).toBe(final);
		});
	});

	describe('uniq()', () => {
    /** setup */
		const notUnique = ['foo', 'foo', 'bar', 'bar', 'foo', 'bar', 'bar', 'foo'];
		const unique = ['foo', 'bar'];

    /** tests */
		test('should remove repeated elements in an array', () => {
			expect(uniq(notUnique)).toEqual(unique);
		});
	});

	describe.skip('desire()', () => {
    /** TODO */
	});

	describe('pathHasAncestor()', () => {
		test('should return true if ancestorPath is ancestor', () => {
			expect(pathHasAncestor('src/grandparent/parent/child', 'src/grandparent')).toBe(true);
		});
		test('should return true if ancestorPath is direct parent', () => {
			expect(pathHasAncestor('src/test', 'src')).toBe(true);
		});
		test('should return true if targetPath and ancestorPath are equal', () => {
			expect(pathHasAncestor('src/test', 'src/test')).toBe(true);
		});
		test('should return false if ancestorPath is not an ancestor', () => {
			expect(pathHasAncestor('src/test', 'dist')).toBe(false);
		});
	});
});
