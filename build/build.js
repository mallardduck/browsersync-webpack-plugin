const fs = require('fs');
const path = require('path');

const { ModuleConcatStream } = require('module-concat');
const { transform } = require('babel-core');
const { babel: config } = require('../package.json');

const input = path.resolve(`${__dirname}/../src/BrowserSyncWebpackPlugin.js`);
const output = path.resolve(`${__dirname}/../index.js`);

const stream = new ModuleConcatStream(input, { excludeNodeModules: true });
const transpiled = transform(stream.setEncoding('utf8').read(), config);

fs.writeFileSync(output, transpiled.code);
