/* eslint-env mocha */

const util = require('../util');
const { assert } = require('chai');

describe('Utils', () => {
  describe('merge()', () => {
    /** setup */
    const dataset = { str: 'foo', arr: ['foo', 'bar'], obj: { foo: 'bar' } };
    const append = { arr: ['biz', 'baz'] };
    const final = dataset;
    final.arr.push('biz', 'baz');

    /** tests */
    it('should concatenate nested arrays', () => {
      assert.deepEqual(util.merge(dataset, append), final);
    });
  });

  describe('uniq()', () => {
    /** setup */
    const notUnique = ['foo', 'foo', 'bar', 'bar', 'foo', 'bar', 'bar', 'foo'];
    const unique = ['foo', 'bar'];

    /** tests */
    it('should remove repeated elements in an array', () => {
      assert.deepEqual(util.uniq(notUnique), unique);
    });
  });

  describe('desire()', () => {
    /** TODO */
  });
});
