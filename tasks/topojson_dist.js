var fs = require('fs-extra');
var common = require('./util/common');
var constants = require('./util/constants');

// main
copyTopojsonFiles();

// copy topojson files from vendor/ to dist/
function copyTopojsonFiles() {
    fs.copy(
        constants.pathToTopojsonVendor,
        constants.pathToTopojsonDist,
        { clobber: true },
        common.throwOnError
    );
}
