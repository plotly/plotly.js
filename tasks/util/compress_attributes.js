var through = require('through2');

/**
 * Browserify transform that strips meta attributes out
 * of the plotly.js bundles
 */

var attributeNamesToRemove = [
    'description', 'requiredOpts', 'otherOpts', 'hrName', 'role'
];

// ref: http://www.regexr.com/3cmac
var regexStr = '';
attributeNamesToRemove.forEach(function(attr, i) {
    // one line string with or without trailing comma
    regexStr += attr + ': \'.*\'' + ',?' + '|';

    // joined array of strings with or without trailing comma
    regexStr += attr + ': \\[[\\s\\S]*?\\]\\.join\\(.*' + ',?';

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
