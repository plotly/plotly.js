var fs = require('fs');

var browserify = require('browserify');

var compressAttributes = require('./util/compress_attributes');
var constants = require('./util/constants');

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
.bundle(function(err) {
    if(err) throw err;
})
.pipe(fs.createWriteStream(constants.pathToPlotlyBuild));


// Browserify the geo assets
browserify(constants.pathToPlotlyGeoAssetsSrc, {
    standalone: 'PlotlyGeoAssets'
})
.bundle(function(err) {
    if(err) throw err;
})
.pipe(fs.createWriteStream(constants.pathToPlotlyGeoAssetsDist));
