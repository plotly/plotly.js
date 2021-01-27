var prependFile = require('prepend-file');
var constants = require('./util/constants');
var common = require('./util/common');

function addHeadersInDistFiles() {
    function _prepend(path, header) {
        prependFile(path, header + '\n', common.throwOnError);
    }

    // add header to main dist bundles
    var pathsDist = [
        constants.pathToPlotlyDistMin,
        constants.pathToPlotlyDist,
        constants.pathToPlotlyDistWithMeta,
        constants.pathToPlotlyGeoAssetsDist
    ];
    pathsDist.forEach(function(path) {
        _prepend(path, constants.licenseDist);
    });

    // add header and bundle name to partial bundle
    constants.partialBundlePaths.forEach(function(pathObj) {
        var headerDist = constants.licenseDist
            .replace('plotly.js', 'plotly.js (' + pathObj.name + ')');
        _prepend(pathObj.dist, headerDist);

        var headerDistMin = constants.licenseDist
            .replace('plotly.js', 'plotly.js (' + pathObj.name + ' - minified)');
        _prepend(pathObj.distMin, headerDistMin);
    });
}

addHeadersInDistFiles();
