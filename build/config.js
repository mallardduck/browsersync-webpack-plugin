const webpack = require('webpack');
const path = require('path');
const util = require('util');
const fs = require('fs');

const version = require('../package.json').version;
const basedir = path.join(__dirname, '../');

const externals = {};

fs.readdirSync(path.join(basedir, 'node_modules'))
  .filter(x =>  ['.bin'].indexOf(x) === -1)
  .forEach(external => {
    externals[external] = 'commonjs ' + external;
  });

module.exports = {
  entry: [path.join(basedir, 'src/BrowserSyncWebpackPlugin.js')],
  output: {
    filename: 'index.js',
    path: basedir,
    library: 'browsersync-webpack-plugin',
    libraryTarget: 'commonjs2',
  },
  externals,
  target: 'node',
};
