var fs = require('fs');

var browserify = require('browserify');
var UglifyJS = require('uglify-js');

var compressAttributes = require('./util/compress_attributes');
var constants = require('./util/constants');

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
try {
    fs.statSync(constants.pathToCSSBuild).isFile();
    fs.statSync(constants.pathToFontSVGBuild).isFile();
}
catch(e) {
    throw new Error([
        'build/ is missing a or more files',
        'Please run `npm run preprocess` first'
    ].join('\n'));
}


// Browserify plotly.js
browserify(constants.pathToPlotlyIndex, {
    debug: DEV,
    standalone: 'Plotly',
    transform: [compressAttributes]
})
.bundle(function(err, buf) {
    if(err) throw err;

    // generate plotly.min.js
    if(!DEV) {
        fs.writeFile(
            constants.pathToPlotlyDistMin,
            UglifyJS.minify(buf.toString(), constants.uglifyOptions).code
        );
    }
})
.pipe(fs.createWriteStream(constants.pathToPlotlyDist));


// Browserify the geo assets
browserify(constants.pathToPlotlyGeoAssetsSrc, {
    standalone: 'PlotlyGeoAssets'
})
.bundle(function(err) {
    if(err) throw err;
})
.pipe(fs.createWriteStream(constants.pathToPlotlyGeoAssetsDist));


// Browserify the plotly.js with meta
browserify(constants.pathToPlotlyIndex, {
    debug: DEV,
    standalone: 'Plotly'
})
.bundle(function(err) {
    if(err) throw err;
})
.pipe(fs.createWriteStream(constants.pathToPlotlyDistWithMeta));
