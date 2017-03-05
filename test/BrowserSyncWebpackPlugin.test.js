/* eslint-env jest */

import BrowserSyncWebpackPlugin from '../src/BrowserSyncWebpackPlugin';

const noop = () => {};
const nodeCallback = function () {
	const args = Array.from(arguments);
	const fn = args[args.length - 1];
	fn.apply(fn);
};

describe('BrowserSyncWebpackPlugin', () => {
	test.skip('should exit early if options.disable is true', () => {
		const test = new BrowserSyncWebpackPlugin({ disable: true }, {});
		test.apply({});
		expect(test.compiler).toBe(undefined);
	});
	describe('Events', () => {
		const mockBrowserSync = { init: nodeCallback, notify: noop, use: noop };
		const mockCompiler = { plugin: nodeCallback };
		const makePluginInstance = config => {
			const plugin = new BrowserSyncWebpackPlugin(config, mockBrowserSync);
      // Let's not deal with the middleware
			plugin.setupWebpackDevMiddleware = plugin.setupWebpackHotMiddleware = noop;
			return plugin;
		};

		test.skip('fire a setup event', done => {
			return makePluginInstance({
				events: { setup() { done(); } }
			}).apply(mockCompiler);
		});
		test.skip('fire a ready event', done => {
			return makePluginInstance({
				delay: 1, // No need for delay
				events: { ready() { done(); } }
			}).apply(mockCompiler);
		});
	});
});
