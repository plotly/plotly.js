/**
 * Print the CHANGELOG.md section of one release, without its heading.
 *
 * Usage: node tasks/release_notes.mjs [version]
 *
 * The version defaults to the version in package.json. The script exits with an error when CHANGELOG.md holds no section for the version.
 */
import fs from 'node:fs';
import pkg from '../package.json' with { type: 'json' };
import constants from './util/constants.js';

const version = process.argv[2] ?? pkg.version;
const lines = fs.readFileSync(constants.pathToChangelog, 'utf-8').split('\n');

const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
if (start === -1) {
    console.error(`CHANGELOG.md holds no section for ${version}`);
    process.exit(1);
}

const end = lines.findIndex((line, i) => i > start && line.startsWith('## ['));
const section = lines.slice(start + 1, end === -1 ? undefined : end);

console.log(section.join('\n').trim());
