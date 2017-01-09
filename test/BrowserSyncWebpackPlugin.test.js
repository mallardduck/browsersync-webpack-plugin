/* eslint-env mocha */

const BrowserSyncWebpackPlugin = require('..');
const { assert } = require('chai');

const noop = () => {};
const nodeCallback = function () {
  const args = Array.from(arguments);
  const fn = args[args.length - 1];
  fn.apply(fn);
};

describe('BrowserSyncWebpackPlugin', () => {
  it('should exit early if options.disable is true', () => {
    const test = new BrowserSyncWebpackPlugin({ disable: true }, {});
    test.apply({});
    assert.equal(test.compiler, undefined);
  });
  describe('Events', () => {
    const mockBrowserSync = { init: nodeCallback, notify: noop };
    const mockCompiler = { plugin: nodeCallback };
    const makePluginInstance = config => {
      const plugin = new BrowserSyncWebpackPlugin(config, mockBrowserSync);
      // Let's not deal with the middleware
      plugin.addWebpackDevMiddleware = plugin.addWebpackHotMiddleware = noop;
      return plugin;
    };

    it('fire a setup event', done => {
      return makePluginInstance({
        events: { setup () { done(); } }
      }).apply(mockCompiler);
    });
    it('fire a start event', done => {
      return makePluginInstance({
        events: { start () { done(); } }
      }).apply(mockCompiler);
    });
  });
});
