var constants = require('./util/constants');
var _bundle = require('./util/browserify_wrapper');

/*
 * Trimmed down version of ./bundle.js for CI testing
 *
 * Outputs:
 *
 *  - plotly.js bundle in build/
 *  - plotly-geo-assets.js bundle in build/ (in accordance with test/image/index.html)
 *  - plotly.min.js bundle in build/ (for minified_bundle test)
 */

// Browserify plotly.js and plotly.min.js
_bundle(constants.pathToPlotlyIndex, constants.pathToPlotlyBuild, {
    standalone: 'Plotly',
    debug: true,
    pathToMinBundle: constants.pathToPlotlyBuildMin
});

// Browserify the geo assets
_bundle(constants.pathToPlotlyGeoAssetsSrc, constants.pathToPlotlyGeoAssetsDist, {
    standalone: 'PlotlyGeoAssets'
});
