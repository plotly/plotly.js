var through = require('through2');

/**
 * Browserify transform that strips meta attributes out
 * of the plotly.js bundles
 */

var WHITESPACE_BEFORE = '\\s*';
var OPTIONAL_COMMA = ',?';

// one line string with or without trailing comma
function makeStringRegex(attr) {
    return makeRegex(
        WHITESPACE_BEFORE + attr + ': \'.*\'' + OPTIONAL_COMMA
    );
}

// joined array of strings with or without trailing comma
function makeJoinedArrayRegex(attr) {
    return makeRegex(
        WHITESPACE_BEFORE + attr + ': \\[[\\s\\S]*?\\]' + '\\.join\\(.*' + OPTIONAL_COMMA
    );
}

// array with or without trailing comma
function makeArrayRegex(attr) {
    return makeRegex(
        WHITESPACE_BEFORE + attr + ': \\[[\\s\\S]*?\\]' + OPTIONAL_COMMA
    );
}

function makeRegex(regexStr) {
    return (
        new RegExp(regexStr, 'g')
    );
}

module.exports = path => {
    const allChunks = [];
    return through(
        (chunk, _, next) => {
            allChunks.push(chunk);
            next();
        },
        function(done) {
            const str = Buffer.concat(allChunks).toString('utf-8');

            // Return JSON as stringified JSON so that ESBuild will handle transformation
            if(path.toLowerCase().endsWith('.json')) {
                this.push(JSON.stringify(str));
                done();
            }

            this.push(
                str
                    .replace(makeStringRegex('description'), '')
                    .replace(makeJoinedArrayRegex('description'), '')
                    .replace(makeArrayRegex('requiredOpts'), '')
                    .replace(makeArrayRegex('otherOpts'), '')
                    .replace(makeStringRegex('role'), '')
                    .replace(makeStringRegex('hrName'), '')
            );
            done();
        }
    );
};
