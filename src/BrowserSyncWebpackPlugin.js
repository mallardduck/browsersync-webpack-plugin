import EventEmitter from 'events';
import url from 'url';
import path from 'path';
import browserSync from 'browser-sync';
import { desire, uniq, merge, pathHasAncestor } from './util';

const debuglog = require('util').debuglog('BrowserSyncWebpackPlugin');

const htmlInjector = desire('bs-html-injector');
const webpackDevMiddleware = desire('webpack-dev-middleware');
const webpackHotMiddleware = desire('webpack-hot-middleware');

/**
 * BrowserSyncWebpackPlugin
 * Combines BrowserSync, webpack-dev-middleware, and webpack-hot-middleware into one ezpz plugin.
 *
 * @class BrowserSyncWebpackPlugin
 */
export default class BrowserSyncWebpackPlugin extends EventEmitter {

  /**
   * Creates an instance of BrowserSyncWebpackPlugin.
   * @param {object} options
   */
	constructor(options, watcher = browserSync.create()) {
		super();
		this.started = false;
		this.compiler = null;
		this.middleware = [];
		this.resolvers = [];
		this.watcher = watcher;
		this.watcherConfig = {};
		this.options = merge({
			proxyUrl: 'https://localhost:3000',
			watch: [],
			sync: true,
			delay: 50,
			debounce: 100,
			events: {
				setup() {},
				ready() {},
				update() {},
				add() {},
				change() {},
				unlink() {}
			},
			htmlExtensions: ['.php', '.html'],
			resolvers: [],
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
	registerEvents() {
		Object.keys(this.options.events).forEach(event => {
			this.on(event, debuglog.bind(debuglog, `Event: ${event}`));
			this.on(event, this.options.events[event]);
		});
		this.on('webpack.compilation', () => this.watcher.notify('Rebuilding...'));
		this.once('webpack.done', this.start.bind(this));
		this.on('ready', () => {
			this.ready = true;
		});
		this.once('ready', () => {
			this.registerFileUpdateResolvers();
			this.on('update', this.resolveFileUpdate.bind(this));
		});
	}

	registerFileUpdateResolvers() {
		if (this.options.sync) {
			this.resolvers.unshift(this.webpackResolver);
		}
		if (htmlInjector) {
			this.resolvers.unshift(this.htmlInjectorResolver);
		}
		const resolvers = uniq(this.resolvers.concat(this.options.resolvers));
		resolvers.push(this.fallbackResolver);
	}

  /**
   * Resolves files assumed to be handled by webpack
   *
   * Determines if a file is handled by webpack by
   * checking in `compiler.options.context`.
   *
   * Caution: Do not have webpack and BrowserSync watch
   * the same files. This resolver is primarily for files
   * that are not watched by Webpack, but are still swept
   * up by the compiler, such as copying files.
   *
   * Fires compiler.run() and then sends reload event.
   */
	webpackResolver(plugin, { file }, resolve) {
		if (pathHasAncestor(file, plugin.compiler.options.context)) {
			plugin.compiler.run(() => plugin.watcher.reload(file));
			return resolve();
		}
	}

  /**
   * Resolves HTML files by injecting changed HTML using bs-html-injector
   *
   * Checks if an updated file matches matches a registerd HTML extension
   * @see {this.options.htmlExtensions}
   */
	htmlInjectorResolver(plugin, { file }, resolve) {
		if (plugin.options.htmlExtensions.indexOf(path.extname(file)) !== -1) {
			setTimeout(htmlInjector, plugin.options.delay);
			return resolve();
		}
	}

  /**
   * Resolves any updated files that remain unresolved after a delay
   *
   * @see {this.options.delay}
   */
	fallbackResolver(plugin, { file }, resolve) {
		setTimeout(() => {
			plugin.watcher.reload(file);
			resolve();
		}, plugin.options.delay);
	}

  /**
   * Attaches events to Compiler object
   * This is called directly by Webpack
   *
   * @param {Compiler} compiler
   * @returns void
   */
	apply(compiler) {
		if (this.options.disable) {
			return;
		}
		this.registerEvents();
		this.compiler = compiler;
		compiler.plugin('done', this.emit.bind(this, 'webpack.done', this));
		compiler.plugin('compilation', this.emit.bind(this, 'webpack.compilation', this));
	}

  /**
   * Start BrowserSync server.
   * @private
   */
	start() {
		this.setup();
		this.watcherConfig.files = [{
			match: uniq(this.watcherConfig.files.concat(this.options.watch)),
			fn: (event, file, stats) => {
				this.emit('update', this, file, stats, event);
				this.emit(event, this, file, stats);
			}
		}];
		this.watcher.init(this.watcherConfig, () => {
			setTimeout(this.emit.bind(this, 'ready', this, this.watcher), this.options.delay);
		});
	}

	resolveFileUpdate(plugin, file, stats, event) {
		Promise.all(this.resolvers.map(resolver => {
			if (resolver instanceof Promise) {
				return resolver;
			}
			return new Promise(resolver.bind(resolver, plugin, { file, stats, event }));
		}));
	}

  /**
   * Setup BrowserSync config.
   * @private
   */
	setup() {
		if (htmlInjector) {
			this.watcher.use(htmlInjector);
		}
		if (webpackDevMiddleware) {
			this.setupWebpackDevMiddleware();
		}
		if (webpackHotMiddleware) {
			this.setupWebpackHotMiddleware();
		}
		this.config();
		this.emit('setup', this, this.watcherConfig);
	}

  /**
   * Setup webpackDevMiddleware
   * @public
   */
	setupWebpackDevMiddleware() {
		this.webpackDevMiddleware = webpackDevMiddleware(this.compiler, merge({
			publicPath: this.options.publicPath || this.compiler.options.output.publicPath,
			stats: false,
			noInfo: true
		}, this.compiler.options.devServer, this.options.advanced.webpackDevMiddleware));
		this.middleware.push(this.webpackDevMiddleware);
	}

  /**
   * Setup webpackHotMiddleware
   * @public
   */
	setupWebpackHotMiddleware() {
		this.webpackHotMiddleware = webpackHotMiddleware(this.compiler, merge({
			log: this.watcher.notify.bind(this.watcher)
		}, this.options.advanced.webpackHotMiddleware));
		this.middleware.push(this.webpackHotMiddleware);
	}

  /**
   * Generate config for BrowserSync.
   * @private
   */
	config() {
		const { usePolling, interval } = (function () {
			const options = this.compiler.options;
			const polling = (options.watchOptions.poll || options.devServer.watchOptions.poll);
			return {
				usePolling: Boolean(polling),
				interval: (polling === Boolean(polling)) ? 100 : polling
			};
		})();
		const binaryInterval = Math.min(interval * 3, interval + 200);
		this.watcherConfig = merge({
			host: url.parse(this.options.proxyUrl).hostname,
			port: url.parse(this.options.proxyUrl).port,
			proxy: {
				target: this.options.target,
				middleware: this.middleware
			},
			reloadDebounce: this.options.debounce,
			files: [],
			watchOptions: {
				ignoreInitial: true
			}
		}, {
			reloadDebounce: this.compiler.options.watchOptions.aggregateTimeout,
			watchOptions: { usePolling, interval, binaryInterval }
		}, this.options.advanced.browserSync);
	}
}
