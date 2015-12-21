var prependFile = require('prepend-file');

var constants = require('./util/constants');


// add headers to dist files

var pathsDist = [
    constants.pathToPlotlyDistMin,
    constants.pathToPlotlyDist,
    constants.pathToPlotlyDistWithMeta,
    constants.pathToPlotlyGeoAssetsDist
];

function headerLicense(path) {
    prependFile(path, constants.licenseDist + '\n', function(err) {
        if(err) throw err;
    });
}

pathsDist.forEach(headerLicense);
