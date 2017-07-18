/* eslint-env jest */

import { uniq, desire } from '../src/util';

describe('Utils', () => {
	describe('uniq()', () => {
		/** setup */
		const notUnique = [
			'foo',
			'foo',
			'bar',
			'bar',
			'foo',
			'bar',
			'bar',
			'foo',
		];
		const unique = ['foo', 'bar'];

		/** tests */
		test('should remove repeated elements in an array', () => {
			expect(uniq(notUnique)).toEqual(unique);
		});
	});

	describe('desire()', () => {
		test('should fail gracefully if module is not found', () => {
			expect(() => desire('notarealmodule')).not.toThrow();
		});
		test('should return undefined if module is not found', () => {
			expect(desire('notarealmodule')).toBe(undefined);
		});
		test('should return a fallback value if module is not found', () => {
			expect(desire('notarealmodule', 'fallback')).toBe(
				'fallback'
			);
		});
		test('should return a module if it exists', () => {
			expect(desire('fs')).toBe(require('fs'));
		});
	});
});
