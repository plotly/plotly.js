var path = require('path');
var { globSync } = require('glob');

var constants = require('../../../tasks/util/constants');


/**
 *  Return array of mock name corresponding to input glob pattern
 *
 *  @param {string} pattern
 *  @return {array}
 */
module.exports = function getMocks(pattern) {
    // ensure string
    pattern = String(pattern);

    // defaults to 'all'
    pattern = pattern || '*';

    // defaults to '.json' ext is none is provided
    if(path.extname(pattern) === '') pattern += '.json';

    var patternFull = constants.pathToTestImageMocks + '/' + pattern;
    var matches = globSync(patternFull);

    // return only the mock name (not a full path, no ext)
    var mockNames = matches.map(function(match) {
        return path.basename(match).split('.')[0];
    });

    return mockNames;
};
