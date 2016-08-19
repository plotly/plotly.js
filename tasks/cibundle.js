var fs = require('fs');

var browserify = require('browserify');

var constants = require('./util/constants');
var common = require('./util/common');
var compressAttributes = require('./util/compress_attributes');

/*
 * Trimmed down version of ./bundle.js for CI testing
 *
 * Outputs plotly.js bundle in build/ and
 * plotly-geo-assets.js bundle in dist/
 * in accordance with test/image/index.html
 *
 */


// Browserify plotly.js
browserify(constants.pathToPlotlyIndex, {
    standalone: 'Plotly',
    transform: [compressAttributes]
})
.bundle(common.throwOnError)
.pipe(fs.createWriteStream(constants.pathToPlotlyBuild));


// Browserify the geo assets
browserify(constants.pathToPlotlyGeoAssetsSrc, {
    standalone: 'PlotlyGeoAssets'
})
.bundle(common.throwOnError)
.pipe(fs.createWriteStream(constants.pathToPlotlyGeoAssetsDist));
