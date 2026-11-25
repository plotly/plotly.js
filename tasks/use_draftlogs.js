const fs = require('fs');
const path = require('path');
const { pathToDraftlogs, pathToChangelog } = require('./util/constants');

const getArg = (name) => {
    const i = process.argv.indexOf(name);
    return i === -1 ? undefined : process.argv[i + 1];
};

const startsWithNumber = (v) => /^[0-9]/.test(v);

const allLogs = fs.readdirSync(pathToDraftlogs).filter(startsWithNumber);

if (!allLogs.length) process.exit(0);

const writeAfterMe = 'where X.Y.Z is the semver of most recent plotly.js release.';
const [head, foot] = fs.readFileSync(pathToChangelog, 'utf-8').split(writeAfterMe);

const all = {
    Added: [],
    Removed: [],
    Deprecated: [],
    Changed: [],
    Fixed: []
};

const suffixToKey = {
    '_add.md': 'Added',
    '_remove.md': 'Removed',
    '_deprecate.md': 'Deprecated',
    '_change.md': 'Changed',
    '_fix.md': 'Fixed'
};

const ENTER = '\n';

const skippedFiles = [];
for (const filename of allLogs) {
    // Trim empty lines and leading whitespace of first line
    const message = fs
        .readFileSync(path.join(pathToDraftlogs, filename), 'utf-8')
        .split(ENTER)
        .filter((e) => !!e)
        .join(ENTER)
        .trimStart();

    const suffix = Object.keys(suffixToKey).find((s) => filename.endsWith(s));
    if (suffix) {
        all[suffixToKey[suffix]].push(message);
    } else {
        skippedFiles.push(filename);
    }
}

const draftNewChangelog = [
    head + writeAfterMe,
    '',
    `## [${getArg('--version') ?? 'X.Y.Z'}] -- ${getArg('--date') ?? 'UNRELEASED'}`
];

for (const [key, newMessages] of Object.entries(all)) {
    if (!newMessages.length) continue;
    draftNewChangelog.push('', `### ${key}`, newMessages.join(ENTER));
}

draftNewChangelog.push(foot);

fs.writeFileSync(pathToChangelog, draftNewChangelog.join(ENTER), 'utf-8');

if (skippedFiles.length) {
    throw JSON.stringify({ skippedFiles }, null, 2);
}
