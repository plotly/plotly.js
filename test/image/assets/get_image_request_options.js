var path = require('path');
var constants = require('../../../tasks/util/constants');

var DEFAULT_FORMAT = 'png';
var DEFAULT_SCALE = 1;

/**
 *  Return the image server request options for a given mock (and specs)
 *
 *  @param {object} specs
 *      mockName : name of json mock to plot
 *      format (optional): format of generated image
 *      scale (optional): scale of generated image
 *      url (optional): URL of image server
 */
module.exports = function getRequestOpts(specs) {
    var pathToMock = path.join(constants.pathToTestImageMocks, specs.mockName) + '.json';
    var figure = require(pathToMock);

    var body = {
        figure: figure,
        format: specs.format || DEFAULT_FORMAT,
        scale: specs.scale || DEFAULT_SCALE
    };

    if(specs.width) body.width = specs.width;
    if(specs.height) body.height = specs.height;

    return {
        method: 'POST',
        url: constants.testContainerUrl,
        body: JSON.stringify(body)
    };
};
