var runSeries = require('run-series');
var prependFile = require('prepend-file');

var constants = require('./util/constants');
var common = require('./util/common');
var _bundle = require('./util/browserify_wrapper');

var header = constants.licenseDist + '\n';
var pathToPlotlyDist = constants.pathToPlotlyDist;
var pathToPlotlyIndex = constants.pathToPlotlyIndex;
var pathToPlotlyDistMin = constants.pathToPlotlyDistMin;
var pathToPlotlyDistWithMeta = constants.pathToPlotlyDistWithMeta;

var pathToPlotlyStrict = constants.pathToPlotlyStrict;
var pathToPlotlyStrictDist = constants.pathToPlotlyStrictDist;
var pathToPlotlyStrictDistMin = constants.pathToPlotlyStrictDistMin;

var pathToPlotlyGeoAssetsSrc = constants.pathToPlotlyGeoAssetsSrc;
var pathToPlotlyGeoAssetsDist = constants.pathToPlotlyGeoAssetsDist;

// Check if style build file is there
var doesFileExist = common.doesFileExist;
if(!doesFileExist(constants.pathToCSSBuild)) {
    throw new Error([
        'build/plotcss.js is missing',
        'Please run `npm run preprocess` first'
    ].join('\n'));
}

// list of tasks to pass to run-series to not blow up
// memory consumption.
var tasks = [];

// Browserify plotly.js
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDist, {
        standalone: 'Plotly',
        pathToMinBundle: pathToPlotlyDistMin
    }, function() {
        prependFile.sync(pathToPlotlyDist, header, common.throwOnError);
        prependFile.sync(pathToPlotlyDistMin, header, common.throwOnError);

        done();
    });
});

// Browserify plotly.js-strict
tasks.push(function(done) {
    _bundle(pathToPlotlyStrict, pathToPlotlyStrictDist, {
        standalone: 'Plotly',
        pathToMinBundle: pathToPlotlyStrictDistMin
    }, function() {
        prependFile.sync(pathToPlotlyStrictDist, header.replace('plotly.js', 'plotly.js (strict)'), common.throwOnError);
        prependFile.sync(pathToPlotlyStrictDistMin, header.replace('plotly.js', 'plotly.js (strict - minified)'), common.throwOnError);

        done();
    });
});

// Browserify the geo assets
tasks.push(function(done) {
    _bundle(pathToPlotlyGeoAssetsSrc, pathToPlotlyGeoAssetsDist, {
        standalone: 'PlotlyGeoAssets'
    }, function() {
        prependFile.sync(pathToPlotlyGeoAssetsDist, header, common.throwOnError);

        done();
    });
});

// Browserify plotly.js with meta
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDistWithMeta, {
        standalone: 'Plotly',
        noCompress: true
    }, function() {
        prependFile.sync(pathToPlotlyDistWithMeta, header, common.throwOnError);

        done();
    });
});

runSeries(tasks, function(err) {
    if(err) throw err;
});
