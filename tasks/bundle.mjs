import runSeries from 'run-series';

import constants from './util/constants.js';
import common from './util/common.js';
import _bundle from './util/bundle_wrapper.mjs';

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

// Bundle plotly.js
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDist, {
    }, function() {
        common.prependFile(pathToPlotlyDist, header);

        done();
    });
});

// Bundle plotly.min.js
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDistMin, {
        minify: true,
    }, function() {
        common.prependFile(pathToPlotlyDistMin, header);

        done();
    });
});

// Bundle plotly.js-strict
tasks.push(function(done) {
    _bundle(pathToPlotlyStrict, pathToPlotlyStrictDist, {
    }, function() {
        common.prependFile(pathToPlotlyStrictDist, header.replace('plotly.js', 'plotly.js (strict)'));

        done();
    });
});

// Bundle plotly.min.js-strict
tasks.push(function(done) {
    _bundle(pathToPlotlyStrict, pathToPlotlyStrictDistMin, {
        minify: true,
    }, function() {
        common.prependFile(pathToPlotlyStrictDistMin, header.replace('plotly.js', 'plotly.js (strict - minified)'));

        done();
    });
});

// Bundle the geo assets
tasks.push(function(done) {
    _bundle(pathToPlotlyGeoAssetsSrc, pathToPlotlyGeoAssetsDist, {
        noPlugins: true,
        standalone: 'PlotlyGeoAssets'
    }, function() {
        common.prependFile(pathToPlotlyGeoAssetsDist, header);

        done();
    });
});

// Bundle plotly.js with meta
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDistWithMeta, {
        noCompressAttributes: true
    }, function() {
        common.prependFile(pathToPlotlyDistWithMeta, header);

        done();
    });
});

runSeries(tasks, function(err) {
    if(err) throw err;
});
