const fs = require('fs');

/**
 * esbuild plugin that strips out meta attributes of the plotly.js
 * bundles. This helps reduce the file size for the build.
 */

const WHITESPACE_BEFORE = '\\s*';
const OPTIONAL_COMMA = ',?';

// Match one line string
const makeStringRegex = (attr) => makeRegex(attr + ": '.*'");

// Match joined array of strings
const makeJoinedArrayRegex = (attr) => makeRegex(attr + ': \\[[\\s\\S]*?\\]' + '\\.join\\([\\s\\S]*?\\)');

// Match array
const makeArrayRegex = (attr) => makeRegex(attr + ': \\[[\\s\\S]*?\\]');

const makeRegex = (regexStr) => new RegExp(WHITESPACE_BEFORE + regexStr + OPTIONAL_COMMA, 'g');

const allRegexes = [
    makeStringRegex('description'),
    makeJoinedArrayRegex('description'),
    makeArrayRegex('requiredOpts'),
    makeArrayRegex('otherOpts'),
    makeStringRegex('role'),
    makeStringRegex('hrName')
];

const esbuildPluginStripMeta = {
    name: 'strip-meta-attributes',
    setup(build) {
        build.onLoad({ filter: /\.js$/ }, async (file) => ({
            contents: await fs.promises.readFile(file.path, 'utf-8').then((c) => {
                allRegexes.forEach((r) => {
                    c = c.replace(r, '');
                });
                return c;
            }),
            loader: 'js'
        }));
    }
};

module.exports = esbuildPluginStripMeta;
