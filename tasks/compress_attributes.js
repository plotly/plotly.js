const fs = require('fs');

/**
 * ESBuild plugin that strips out meta attributes
 * of the plotly.js bundles
 */

var WHITESPACE_BEFORE = '\\s*';
var OPTIONAL_COMMA = ',?';

// one line string with or without trailing comma
function makeStringRegex(attr) {
    return makeRegex(WHITESPACE_BEFORE + attr + ": '.*'" + OPTIONAL_COMMA);
}

// joined array of strings with or without trailing comma
function makeJoinedArrayRegex(attr) {
    return makeRegex(WHITESPACE_BEFORE + attr + ': \\[[\\s\\S]*?\\]' + '\\.join\\(.*' + OPTIONAL_COMMA);
}

// array with or without trailing comma
function makeArrayRegex(attr) {
    return makeRegex(WHITESPACE_BEFORE + attr + ': \\[[\\s\\S]*?\\]' + OPTIONAL_COMMA);
}

function makeRegex(regexStr) {
    return new RegExp(regexStr, 'g');
}

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
        const loader = 'js';
        build.onLoad({ filter: /\.js$/ }, async (file) => ({
            contents: await fs.promises.readFile(file.path, 'utf-8').then((c) => {
                allRegexes.forEach((r) => {
                    c = c.replace(r, '');
                });
                return c;
            }),
            loader
        }));
    }
};

module.exports = esbuildPluginStripMeta;
