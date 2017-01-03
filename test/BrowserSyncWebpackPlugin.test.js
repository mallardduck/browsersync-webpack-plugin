const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const { promisify } = require('../src/util');
const BrowserSyncWebpackPlugin = require('../src/BrowserSyncWebpackPlugin');
const compiler = require('./fixtures/compiler');

const rimrafAsync = promisify(rimraf);
const mkdirpAsync = promisify(mkdirp);

const noop = () => {};
const nodeCallback = function () {
  const args = Array.from(arguments);
  const fn = args[args.length - 1];
  fn.apply(fn);
};

describe('BrowserSyncWebpackPlugin', () => {
  before('set up', (done) => {
    mkdirpAsync(compiler.workspace)
      .then(() => done())
      .catch(err => { throw err; });
  });

  after('clean up', (done) => {
    rimrafAsync(compiler.workspace)
      .then(() => done())
      .catch(err => { throw err; });
  });

  describe('Events', () => {
    const mockBrowserSync = { init: nodeCallback, notify: noop };
    const mockCompiler = { plugin: nodeCallback };
    const makeMockPlugin = (event, done) => {
      const events = {};
      events[event] = () => done();
      const plugin = new BrowserSyncWebpackPlugin({
        events,
        middleware () {}
      }, mockBrowserSync);
      // Let's not deal with the middleware
      plugin.addWebpackDevMiddleware = plugin.addWebpackHotMiddleware = noop;
      plugin.apply(mockCompiler);
      return plugin;
    };

    it('fire a setup event', done => makeMockPlugin('setup', done));
    it('fire a start event', done => makeMockPlugin('start', done));
    it('fire a reload event', done => {
      const test = makeMockPlugin('reload', done);
      test.emit('webpack.done');
    });
  });
});
