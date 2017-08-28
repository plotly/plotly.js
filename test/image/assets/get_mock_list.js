var path = require('path');
var glob = require('glob');

var constants = require('../../../tasks/util/constants');

/**
 *  Return array of mock name corresponding to input glob pattern
 *
 *  @param {array} _ : argv._ from minimist
 *  @return {array}
 */
module.exports = function getMockList(_) {
    if(_.length === 0) {
        return fromPattern('*');
    } else {
        return _
            .map(String)
            .map(fromPattern)
            .reduce(function(a, b) { return a.concat(b); });
    }
};

function fromPattern(pattern) {
    // defaults to '.json' ext is none is provided
    if(path.extname(pattern) === '') pattern += '.json';

    var patternFull = path.join(constants.pathToTestImageMocks, pattern);
    var matches = glob.sync(patternFull);

    // return only the mock name (not a full path, no ext)
    var mockNames = matches.map(function(match) {
        return path.basename(match).split('.')[0];
    });

    return mockNames;
}
