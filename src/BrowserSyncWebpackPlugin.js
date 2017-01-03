const EventEmitter = require('events');
const url = require('url');
const _debuglog = require('util').debuglog;
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const browserSync = require('browser-sync');
const {uniq, merge} = require('./util');

const debuglog = _debuglog('BrowserSyncWebpackPlugin');

/**
 * BrowserSyncWebpackPlugin
 * Combines BrowserSync, webpack-dev-middleware, and webpack-hot-middleware into one ezpz plugin.
 *
 * @class BrowserSyncWebpackPlugin
 */
module.exports = class extends EventEmitter {

  /**
   * Creates an instance of BrowserSyncWebpackPlugin.
   * @param {object} options
   */
  constructor (options, watcher = browserSync.create()) {
    super();
    this.compiler = null;
    this.middleware = [];
    this.watcher = watcher;
    this.watcherConfig = {};
    this.options = merge({
      proxyUrl: 'https://localhost:3000',
      watch: [],
      events: {
        start () {},
        reload () {},
        change () {}
      }
    }, options);
    this.registerEvents();
  }

  /**
   * Registers all events
   * @private
   */
  registerEvents () {
    Object.keys(this.options.events).forEach(event => {
      this.on(event, debuglog.bind(debuglog, `Event: ${event}`));
      this.on(event, this.options.events[event]);
    });
    this.once('webpack.done', () => {
      this.start();
      this.on('webpack.done', this.reload.bind(this));
    });
    this.on('webpack.compilation', () => this.watcher.notify('Rebuilding...'));
  }

  /**
   * Attaches events to Compiler object
   * This is called directly by Webpack
   *
   * @param {Compiler} compiler
   * @returns void
   */
  apply (compiler) {
    if (this.options.disable) {
      return;
    }
    this.compiler = compiler;
    compiler.plugin('done', this.emit.bind(this, 'webpack.done', this));
    compiler.plugin('compilation', this.emit.bind(this, 'webpack.compilation', this));
  }

  /**
   * Start BrowserSync server.
   * @private
   */
  start () {
    this.setup();
    this.watcherConfig.files = uniq(this.watcherConfig.files.concat(this.options.watch));
    this.watcher.init(this.watcherConfig, this.emit.bind(this, 'start', this, this.watcher));
  }

  /**
   * Setup BrowserSync config.
   * @private
   */
  setup () {
    this.addWebpackDevMiddleware();
    this.addWebpackHotMiddleware();
    this.config();
    this.emit('setup', this, this.watcherConfig);
  }

  /**
   * Generate config for BrowserSync.
   * @private
   */
  config () {
    this.watcherConfig = merge({
      host: url.parse(this.options.proxyUrl).hostname,
      port: url.parse(this.options.proxyUrl).port,
      proxy: {
        target: this.options.target,
        middleware: this.middleware
      },
      files: []
    }, this.options.browserSyncOptions);
  }

  /**
   * Reload event is fired with webpack `done` event.
   * @private
   */
  reload () {
    this.emit('reload', this, this.watcher);
  }

  /**
   * Setup webpackDevMiddleware
   * @public
   */
  addWebpackDevMiddleware () {
    this.webpackDevMiddleware = webpackDevMiddleware(this.compiler, {
      publicPath: this.options.publicPath,
      stats: false,
      noInfo: true
    });
    this.middleware.push(this.webpackDevMiddleware);
  }

  /**
   * Setup webpackHotMiddleware
   * @public
   */
  addWebpackHotMiddleware () {
    this.webpackHotMiddleware = webpackHotMiddleware(this.compiler, {
      log: this.watcher.notify.bind(this.watcher)
    });
    this.middleware.push(this.webpackHotMiddleware);
  }
};
