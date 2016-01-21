var fs = require('fs-extra');

var sass = require('node-sass');

var pullCSS = require('./util/pull_css');
var pullFontSVG = require('./util/pull_font_svg');
var updateVersion = require('./util/update_version');
var constants = require('./util/constants');


// convert scss to css
sass.render({
    file: constants.pathToSCSS,
    outputStyle: 'compressed'
}, function(err, result) {
    if(err) console.log('SASS error');

    // css to js
    pullCSS(String(result.css), constants.pathToCSSBuild);
});

// convert font svg into js
fs.readFile(constants.pathToFontSVG, function(err, data) {
    pullFontSVG(data.toString(), constants.pathToFontSVGBuild);
});

// copy topojson files from sane-topojson to dist/
fs.copy(constants.pathToTopojsonSrc, constants.pathToTopojsonDist,
    { clobber: true },
    function(err) { if(err) throw err; }
);

// inject package version into source index files
updateVersion(constants.pathToPlotlyCore);
updateVersion(constants.pathToPlotlyGeoAssetsSrc);
