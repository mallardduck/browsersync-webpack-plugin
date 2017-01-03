const util = require('../src/util');
const { assert } = require('chai');

describe('Utils', () => {
  describe('promisify()', () => {
    /** setup */
    const successMsg = 'Yay it worked!';
    const errMsg = 'First parameter must be a string';
    const nodeStyleAsyncFn = (str, callback) => {
      const err = (typeof str === 'string') ? null : errMsg;
      const data = (typeof str === 'string') ? successMsg : null;
      setTimeout(() => { callback(err, data); }, 5);
    };
    const promisifiedAsyncFn = util.promisify(nodeStyleAsyncFn);

    /** tests */
    it('should be a Promise instance', () => {
      assert.instanceOf(promisifiedAsyncFn('a string'), Promise);
    });
    it('should resolve successes', () => {
      return promisifiedAsyncFn('a string')
        .then(data => assert.equal(data, successMsg));
    });
    it('should reject errors', () => {
      return promisifiedAsyncFn(['not', 'a', 'string'])
        .catch(err => assert.equal(err, errMsg));
    });
  });

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
});
