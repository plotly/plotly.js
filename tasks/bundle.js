var constants = require('./util/constants');
var common = require('./util/common');
var _bundle = require('./util/browserify_wrapper');

/*
 * This script takes one argument
 *
 * Run `npm run build -- dev` or `npm run build -- --dev`
 * to include source map in the plotly.js bundle
 *
 * N.B. This script is meant for dist builds; the output bundles are placed
 *      in plotly.js/dist/.
 *      Use `npm run watch` for dev builds.
 */

var arg = process.argv[2];
var DEV = (arg === 'dev') || (arg === '--dev');


// Check if style and font build files are there
var doesFileExist = common.doesFileExist;
if(!doesFileExist(constants.pathToCSSBuild) || !doesFileExist(constants.pathToFontSVG)) {
    throw new Error([
        'build/ is missing one or more files',
        'Please run `npm run preprocess` first'
    ].join('\n'));
}

// Browserify plotly.js
_bundle(constants.pathToPlotlyIndex, constants.pathToPlotlyDist, {
    standalone: 'Plotly',
    debug: DEV,
    pathToMinBundle: constants.pathToPlotlyDistMin
});

// Browserify the geo assets
_bundle(constants.pathToPlotlyGeoAssetsSrc, constants.pathToPlotlyGeoAssetsDist, {
    standalone: 'PlotlyGeoAssets'
});

// Browserify the plotly.js with meta
_bundle(constants.pathToPlotlyIndex, constants.pathToPlotlyDistWithMeta, {
    standalone: 'Plotly',
    debug: DEV
});

// Browserify the plotly.js partial bundles
constants.partialBundlePaths.forEach(function(pathObj) {
    _bundle(pathObj.index, pathObj.dist, {
        standalone: 'Plotly',
        debug: DEV,
        pathToMinBundle: pathObj.distMin
    });
});
