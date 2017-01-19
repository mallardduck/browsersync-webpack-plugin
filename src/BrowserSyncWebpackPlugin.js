const EventEmitter = require('events');
const url = require('url');
const debuglog = require('util').debuglog('BrowserSyncWebpackPlugin');
const browserSync = require('browser-sync');
const { desire, uniq, merge, pathHasAncestor } = require('./util');

const webpackDevMiddleware = desire('webpack-dev-middleware', () => {});
const webpackHotMiddleware = desire('webpack-hot-middleware', () => {});

/**
 * BrowserSyncWebpackPlugin
 * Combines BrowserSync, webpack-dev-middleware, and webpack-hot-middleware into one ezpz plugin.
 *
 * @class BrowserSyncWebpackPlugin
 */
module.exports = class BrowserSyncWebpackPlugin extends EventEmitter {

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
      sync: true,
      syncDelay: 1000,
      events: {
        setup () {},
        start () {},
        update () {},
        add () {},
        change () {},
        unlink () {}
      },
      advanced: {
        browserSync: {},
        webpackDevMiddleware: {},
        webpackHotMiddleware: {}
      }
    }, options);
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
    this.on('webpack.compilation', () => this.watcher.notify('Rebuilding...'));
    this.once('webpack.done', this.start.bind(this));
    if (this.options.sync) {
      this.once('start', () => setTimeout(this.registerSyncEvent.bind(this), this.options.syncDelay));
    }
  }

  /**
   * Registers syncronization script with file system events
   *
   * Triggers compiler.run() when a file within compiler.options.context trigers an event
   * @private
   */
  registerSyncEvent () {
    this.on('update', (plugin, file) => {
      if (pathHasAncestor(file, plugin.compiler.options.context)) {
        plugin.compiler.run(() => plugin.watcher.reload(file));
      }
    });
  }

  /**
   * Attaches events to Compiler object
   * This is called directly by Webpack
   *
   * @param {Compiler} compiler
   * @returns void
   */
  apply (compiler) {
    if (this.options.disable) return;
    this.registerEvents();
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
    this.watcherConfig.files = [{
      match: uniq(this.watcherConfig.files.concat(this.options.watch)),
      fn: (event, file, stats) => {
        this.emit('update', this, file, stats, event);
        this.emit(event, this, file, stats);
      }
    }];
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
    }, this.options.advanced.browserSync);
  }

  /**
   * Setup webpackDevMiddleware
   * @public
   */
  addWebpackDevMiddleware () {
    this.webpackDevMiddleware = webpackDevMiddleware(this.compiler, merge({
      publicPath: this.options.publicPath || this.compiler.options.output.publicPath,
      stats: false,
      noInfo: true
    }, this.options.advanced.webpackDevMiddleware));
    this.middleware.push(this.webpackDevMiddleware);
  }

  /**
   * Setup webpackHotMiddleware
   * @public
   */
  addWebpackHotMiddleware () {
    this.webpackHotMiddleware = webpackHotMiddleware(this.compiler, merge({
      log: this.watcher.notify.bind(this.watcher)
    }, this.options.advanced.webpackHotMiddleware));
    this.middleware.push(this.webpackHotMiddleware);
  }
};
