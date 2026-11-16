import path from 'node:path';
import { glob } from 'glob';

import constants from './util/constants.js';
import wrapLocale from './util/wrap_locale.mjs';

const { pathToLib, pathToDist } = constants;

const localeGlob = path.join(pathToLib, 'locales', '*.js');
const files = await glob(localeGlob);
for (const file of files) {
    const outPath = path.join(pathToDist, `plotly-locale-${path.basename(file)}`);
    wrapLocale(file, outPath);
}
