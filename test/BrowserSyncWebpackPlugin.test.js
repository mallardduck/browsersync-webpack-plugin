const BrowserSyncWebpackPlugin = require('../src/BrowserSyncWebpackPlugin');
const { assert } = require('chai');

const noop = () => {};
const nodeCallback = function () {
  const args = Array.from(arguments);
  const fn = args[args.length - 1];
  fn.apply(fn);
};

describe('BrowserSyncWebpackPlugin', () => {
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

    /**
     * (1) Bind a listener to be triggered only once on the `start` event.
     * (2) Once the listener is bound, check the `start` listener count.
     * (3) `reload` listener then checks the `start` listener count to ensure that it has been fired.
     */
    it('fire a reload event only after `start` event has fired', done => {
      let startCount = 0;
      const test = makePluginInstance({
        events: { reload () { assert.notEqual(test.listenerCount('start'), startCount); done(); } } // (3)
      });
      test.once('start', noop); // (1)
      startCount = test.listenerCount('start'); // (2)
      test.apply(mockCompiler); // should fire `start`
      test.apply(mockCompiler); // should fire `reload`
    });
  });
});
