var path = require('path');
var constants = require('../../../tasks/util/constants');
var DEFAULT_FORMAT = 'png';

/**
 * Return paths to baseline, test-image and diff images for a given mock name.
 *
 * @param {string} mockName
 * @param {string} format
 * @return {object}
 *   mock
 *   baseline
 *   test
 *   diff
 */
module.exports = function getImagePaths(mockName, format) {
    format = format || DEFAULT_FORMAT;

    return {
        mock: join(constants.pathToTestImageMocks, mockName, 'json'),
        baseline: join(constants.pathToTestImageBaselines, mockName, format),
        test: join(constants.pathToTestImages, mockName, format),
        diff: join(constants.pathToTestImagesDiff, 'diff-' + mockName, format)
    };
};

function join(basePath, fileName, format) {
    return path.join(basePath, fileName) + '.' + format;
}
