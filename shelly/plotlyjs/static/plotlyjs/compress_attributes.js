'use strict';

/*
 * Browserify transform that strips meta attributes out of the plotlyjs bundle
 *
 */

var through = require('through2');

var attributeNamesToRemove = ['description', 'overview', 'requiredOpts', 'otherOpts', 'role'],
    regexStr = '';

// ref: http://www.regexr.com/3bj6p
attributeNamesToRemove.forEach(function(attr, i) {
    // one line string with or without trailing comma
    regexStr += attr + ': \'.*\'' + ',?' + '|';
    // array of strings with or without trailing comma
    regexStr += attr + ': \\[[\\s\\S]*?\\].*' + ',?';

    if(i !== attributeNamesToRemove.length-1) regexStr += '|';
});

var regex = new RegExp(regexStr, 'g');

module.exports = function() {
    return through(function(buf, enc, next) {
        this.push(
            buf.toString('utf-8')
               .replace(regex, '')
        );
        next();
    });
};
