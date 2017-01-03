const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const path = require('path');
const temppath = require('os').tmpdir();
const randomstring = require('randomstring');

module.exports = (config = {}) => {
  const webpackConfig = Object.assign(config, module.exports.generateConfig());
  const compiler = webpack(webpackConfig);
  compiler.outputFileSystem = new MemoryFS();
  return compiler;
};

module.exports.workspace = path.join(temppath, 'browsersync-webpack-plugin');

module.exports.multi = (...configs) => {
  if (!configs.length >= 2) {
    configs = [module.exports.generateConfig(), module.exports.generateConfig()];
  }
  const outputPath = configs[0].output.path;
  return configs
    .map(config => Object.assign(config, { output: { path: outputPath } }))
    .map(module.exports);
};

module.exports.generateConfig = (entry = 'app.js') => {
  return {
    target: 'web',
    entry: {
      app: path.resolve(__dirname, entry)
    },
    output: {
      path: path.join(module.exports.workspace, randomstring.generate()),
      filename: 'bundle.js'
    }
  };
};
