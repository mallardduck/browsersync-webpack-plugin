/* eslint-env jest */

/**
 * This file ensures that all source code is required for the purposes of coverage metrics.
 */

import { resolve } from 'path';
import glob from 'glob';
import { desire } from '../src/util';

const badPaths = ['.test.js'];

const globToCover = resolve(__dirname, '../src/**/*.js');

const filesToCover = glob
	.sync(globToCover)
	.filter(filepath => badPaths.every(file => !filepath.includes(file)));

filesToCover.forEach(desire);

test('covered files', () => {
	expect(filesToCover.length > 0).toBe(true);
});
