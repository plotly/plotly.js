var fs = require('fs');
var path = require('path');

var browserify = require('browserify');
var UglifyJS = require('uglify-js');

var constants = require('./util/constants');
var common = require('./util/common');
var compressAttributes = require('./util/compress_attributes');
var patchMinified = require('./util/patch_minified');
var doesFileExist = common.doesFileExist;

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

function _bundle(pathToIndex, pathToBundle, opts) {
    opts = opts || {};

    // do we output a minified file?
    var pathToMinBundle = opts.pathToMinBundle,
        outputMinified = !!pathToMinBundle && !opts.debug;

    var browserifyOpts = {};
    browserifyOpts.standalone = opts.standalone;
    browserifyOpts.debug = opts.debug;
    browserifyOpts.transform = outputMinified ? [compressAttributes] : [];

    var b = browserify(pathToIndex, browserifyOpts),
        bundleWriteStream = fs.createWriteStream(pathToBundle);

    bundleWriteStream.on('finish', function() {
        logger(pathToBundle);
    });

    b.bundle(function(err, buf) {
        if(err) throw err;

        if(outputMinified) {
            var minifiedCode = UglifyJS.minify(buf.toString(), constants.uglifyOptions).code;
            minifiedCode = patchMinified(minifiedCode);

            fs.writeFile(pathToMinBundle, minifiedCode, function(err) {
                if(err) throw err;

                logger(pathToMinBundle);
            });
        }
    })
    .pipe(bundleWriteStream);
}

function logger(pathToOutput) {
    var log = 'ok ' + path.basename(pathToOutput);

    console.log(log);
}
