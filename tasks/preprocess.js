var fs = require('fs-extra');
var sass = require('node-sass');

var constants = require('./util/constants');
var common = require('./util/common');
var pullCSS = require('./util/pull_css');
var updateVersion = require('./util/update_version');

// main
makeBuildCSS();
copyTopojsonFiles();
updateVersion(constants.pathToPlotlyVersion);

// convert scss to css to js
function makeBuildCSS() {
    sass.render({
        file: constants.pathToSCSS,
        outputStyle: 'compressed'
    }, function(err, result) {
        if(err) throw err;

        // css to js
        pullCSS(String(result.css), constants.pathToCSSBuild);
    });
}

// copy topojson files from sane-topojson to dist/
function copyTopojsonFiles() {
    fs.copy(
        constants.pathToTopojsonSrc,
        constants.pathToTopojsonDist,
        { clobber: true },
        common.throwOnError
    );
}
