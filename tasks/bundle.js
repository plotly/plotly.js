var path = require('path');
var glob = require('glob');
var runSeries = require('run-series');
var prependFile = require('prepend-file');

var constants = require('./util/constants');
var common = require('./util/common');
var _bundle = require('./util/browserify_wrapper');
var makeSchema = require('./util/make_schema');
var wrapLocale = require('./util/wrap_locale');

var header = constants.licenseDist + '\n';
var pathToLib = constants.pathToLib;
var pathToDist = constants.pathToDist;
var pathToSchema = constants.pathToSchema;
var pathToPlotlyDist = constants.pathToPlotlyDist;
var pathToPlotlyIndex = constants.pathToPlotlyIndex;
var pathToPlotlyDistMin = constants.pathToPlotlyDistMin;
var pathToPlotlyDistWithMeta = constants.pathToPlotlyDistWithMeta;
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

// "Browserify" the locales
var localeGlob = path.join(pathToLib, 'locales', '*.js');
glob(localeGlob, function(err, files) {
    files.forEach(function(file) {
        var outName = 'plotly-locale-' + path.basename(file);
        var outPath = path.join(pathToDist, outName);
        wrapLocale(file, outPath);
    });
});

// list of tasks to pass to run-series to not blow up
// memory consumption.
var tasks = [];

// Browserify plotly.js
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDist, {
        standalone: 'Plotly',
        pathToMinBundle: pathToPlotlyDistMin
    }, function() {
        prependFile(pathToPlotlyDist, header, common.throwOnError);
        prependFile(pathToPlotlyDistMin, header, common.throwOnError);

        done();
    });
});

// Browserify the geo assets
tasks.push(function(done) {
    _bundle(pathToPlotlyGeoAssetsSrc, pathToPlotlyGeoAssetsDist, {
        standalone: 'PlotlyGeoAssets'
    }, function() {
        prependFile(pathToPlotlyGeoAssetsDist, header, common.throwOnError);

        done();
    });
});

// Browserify plotly.js with meta and output plot-schema JSON
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDistWithMeta, {
        standalone: 'Plotly',
        noCompress: true
    }, function() {
        prependFile(pathToPlotlyDistWithMeta, header, common.throwOnError);

        makeSchema(pathToPlotlyDistWithMeta, pathToSchema);
        done();
    });
});

runSeries(tasks, function(err) {
    if(err) throw err;
});
