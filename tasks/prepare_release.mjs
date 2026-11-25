/**
 * Prepare the release files for the version in package.json.
 *
 * Run `npm version <version> --no-git-tag-version --ignore-scripts` first. This script then:
 * - writes the draftlogs into CHANGELOG.md under the version and the date
 * - empties draftlogs/, and updates the version in README.md and CITATION.cff
 *
 * A prerelease version (`X.Y.Z-rc.N`) skips the last step, so the draftlogs stay for the full release.
 *
 * Usage: node tasks/prepare_release.mjs [--date YYYY-MM-DD]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import pkg from '../package.json' with { type: 'json' };
import constants from './util/constants.js';

const { version } = pkg;
const isPrerelease = version.includes('-');

const getArg = (name) => {
    const i = process.argv.indexOf(name);
    return i === -1 ? undefined : process.argv[i + 1];
};

const date = getArg('--date') ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date "${date}". Use YYYY-MM-DD.`);

const runTask = (script, args = []) => {
    const result = spawnSync(process.execPath, [path.join(constants.pathToRoot, 'tasks', script), ...args], {
        stdio: 'inherit'
    });
    if (result.status !== 0) throw new Error(`tasks/${script} exited with code ${result.status}`);
};

const replaceOrThrow = (content, pattern, replacement, file) => {
    if (content.search(pattern) === -1) throw new Error(`Could not find ${pattern} in ${file}`);
    return content.replace(pattern, replacement);
};

const updateReadme = () => {
    const file = path.join(constants.pathToRoot, 'README.md');
    const content = fs.readFileSync(file, 'utf-8');
    const updated = replaceOrThrow(
        content,
        /(https:\/\/cdn\.plot\.ly\/plotly-)\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?((?:\.min)?\.js)/g,
        `$1${version}$2`,
        'README.md'
    );
    fs.writeFileSync(file, updated);
};

const updateCitation = () => {
    const file = path.join(constants.pathToRoot, 'CITATION.cff');
    let content = fs.readFileSync(file, 'utf-8');
    content = replaceOrThrow(content, /^version: .*$/m, `version: ${version}`, 'CITATION.cff');
    content = replaceOrThrow(content, /^date-released: .*$/m, `date-released: ${date}`, 'CITATION.cff');
    fs.writeFileSync(file, content);
};

const hasDraftlogs = fs.readdirSync(constants.pathToDraftlogs).some((f) => /^\d+_\w+\.md$/.test(f));
if (!hasDraftlogs) throw new Error('No draftlogs to release');

runTask('use_draftlogs.js', ['--version', version, '--date', date]);

if (isPrerelease) {
    console.log(`Keep the draftlogs and the README and CITATION versions for prerelease ${version}`);
} else {
    runTask('empty_draftlogs.js');
    updateReadme();
    updateCitation();
}

console.log(`Prepared the release files for ${version} (${date})`);
