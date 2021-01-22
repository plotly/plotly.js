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

module.exports = function() {
    var allChunks = [];
    return through(function(chunk, enc, next) {
        allChunks.push(chunk);
        next();
    }, function(done) {
        var str = Buffer.concat(allChunks).toString('utf-8');
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
    });
};
