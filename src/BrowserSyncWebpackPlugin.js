const EventEmitter = require('events');
const url = require('url');
const debuglog = require('util').debuglog('BrowserSyncWebpackPlugin');

const browserSync = require('browser-sync');
const merge = require('webpack-merge');

const { desire, uniq } = require('./util');

const htmlInjector = desire('bs-html-injector');
const webpackDevMiddleware = desire('webpack-dev-middleware');
const webpackHotMiddleware = desire('webpack-hot-middleware');

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
	constructor(options, watcher = browserSync.create()) {
		super();
		this.open = true;
		this.compiler = null;
		this.middleware = [];
		this.ready = false;
		this.resolvers = [];
		this.watcher = watcher;
		this.watcherConfig = {};
		this.watcherCallback = null;
		this.options = merge({
			proxyUrl: 'https://localhost:3000',
			watch: [],
			sync: true,
			delay: 50,
			debounce: 0,
			callback: null,
			events: {
				setup() { },
				ready() { },
				update() { },
				add() { },
				change() { },
				unlink() { }
			},
			advanced: {
				browserSync: {},
				webpackDevMiddleware: {},
				webpackHotMiddleware: {},
				injectorRequestOptions: {}
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
		this.watcher.emitter.on('init', this.emit.bind(this, 'ready', this, this.watcher));
		this.watcher.emitter.on('file:changed', (event, file, stats) => {
			this.emit('update', this, file, stats, event);
			this.emit(event, this, file, stats);
		});
		this.watcher.init(this.watcherConfig, this.watcherCallback);
	}

	/**
	 * Setup BrowserSync config.
	 * @private
	 */
	setup() {
		if (this.useHtmlInjector() && this.options.watch) {
			this.watcher.use(htmlInjector, {
				files: Array.isArray(this.options.watch) ? uniq(this.options.watch) : [this.options.watch],
				/**
				 * This option does nothing at the moment.
				 * I'm awaiting feedback on a PR.
				 *
				 * @link https://github.com/shakyShane/html-injector/pull/29
				 *
				 * In the meantime either don't use SSL or set the following
				 * super insecure setting:
				 *   process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
				 */
				requestOptions: Object.assign({
					agentOptions: { rejectUnauthorized: false }
				}, this.options.advanced.injectorRequestOptions)
			});
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
		const watchOptions = merge({ ignoreInitial: true }, this.getPollOptions());
		const reloadDebounce = this.options.debounce || watchOptions.aggregateTimeout || 0;
		this.watcherConfig = merge({
			open: this.options.open,
			host: url.parse(this.options.proxyUrl).hostname,
			port: url.parse(this.options.proxyUrl).port,
			proxy: {
				target: this.options.target,
				middleware: this.middleware
			},
			files: (!this.useHtmlInjector() && this.options.watch) ? (Array.isArray(this.options.watch) ? uniq(this.options.watch) : [this.options.watch]) : [],
			reloadDebounce,
			watchOptions
		}, this.options.advanced.browserSync);
		this.watcherCallback = this.options.callback;
	}

	getPollOptions() {
		const watchOptions = this.getWatchOptions();
		const polling = watchOptions.poll || false;
		const usePolling = Boolean(polling);
		const interval = (polling === usePolling) ? 100 : polling;
		return {
			interval,
			usePolling,
			binaryInterval: Math.min(interval * 3, interval + 200)
		};
	}

	/**
	 * Get watchOptions from webpack
	 */
	getWatchOptions() {
		const options = this.compiler.options;
		const webpackWatchOptions = options.watchOptions || {};
		const devServerWatchOptions = (options.devServer ? options.devServer.watchOptions : {}) || {};
		return merge(webpackWatchOptions, devServerWatchOptions);
	}

	/**
	 * Use htmlInjector
	 */
	useHtmlInjector() {
		return htmlInjector !== undefined;
	}
};
