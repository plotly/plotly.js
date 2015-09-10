'use strict';

/*
 * Browserify transform that strips meta attributes out of the plotlyjs bundle
 *
 */

var through = require('through2');

var attributeNamesToRemove = [
    'description', 'requiredOpts', 'otherOpts', 'hrName', 'role'
];

var objectNamesToRemove = ['_deprecated'];

// ref: http://www.regexr.com/3bj6p
var regexStr = '';
attributeNamesToRemove.forEach(function(attr, i) {
    // one line string with or without trailing comma
    regexStr += attr + ': \'.*\'' + ',?' + '|';

    // array (of strings) with or without trailing comma
    regexStr += attr + ': \\[[\\s\\S]*?\\].*' + ',?' + '|';
});

// ref: http://www.regexr.com/3bor2
objectNamesToRemove.forEach(function(obj) {
    // object with '// to delete following trailling '}'
    regexStr += obj + ': {[\\s\\S]*?}' + ',? ?\\/\\/ ?to delete' + '|';
});

// remove trailing '|'
regexStr = regexStr.substring(0, regexStr.length-1);

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
