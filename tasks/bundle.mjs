import runSeries from 'run-series';
import prependFile from 'prepend-file';

import constants from './util/constants.js';
import common from './util/common.js';
import _bundle from './util/bundle_wrapper.mjs';
import fsExtra from 'fs-extra';

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

function amdWrapper(path){
    prependFile.sync(path, "define(function (require, exports, module) {", common.throwOnError)
    fsExtra.appendFile(path, "})", common.throwOnError)
}

// list of tasks to pass to run-series to not blow up
// memory consumption.
var tasks = [];

// Bundle plotly.js
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDist, {
    }, function() {
        prependFile.sync(pathToPlotlyDist, header, common.throwOnError);
        amdWrapper(pathToPlotlyDist)
        done();
    });
});

// Bundle plotly.min.js
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDistMin, {
        minify: true,
    }, function() {
        prependFile.sync(pathToPlotlyDistMin, header, common.throwOnError);
        amdWrapper(pathToPlotlyDistMin)
        done();
    });
});

// Bundle plotly.js-strict
tasks.push(function(done) {
    _bundle(pathToPlotlyStrict, pathToPlotlyStrictDist, {
    }, function() {
        prependFile.sync(pathToPlotlyStrictDist, header.replace('plotly.js', 'plotly.js (strict)'), common.throwOnError);
        amdWrapper(pathToPlotlyStrictDist)
        done();
    });
});

// Bundle plotly.min.js-strict
tasks.push(function(done) {
    _bundle(pathToPlotlyStrict, pathToPlotlyStrictDistMin, {
        minify: true,
    }, function() {
        prependFile.sync(pathToPlotlyStrictDistMin, header.replace('plotly.js', 'plotly.js (strict - minified)'), common.throwOnError);
        amdWrapper(pathToPlotlyStrictDistMin)
        done();
    });
});

// Bundle the geo assets
tasks.push(function(done) {
    _bundle(pathToPlotlyGeoAssetsSrc, pathToPlotlyGeoAssetsDist, {
        noPlugins: true,
        standalone: 'PlotlyGeoAssets'
    }, function() {
        prependFile.sync(pathToPlotlyGeoAssetsDist, header, common.throwOnError);
        amdWrapper(pathToPlotlyGeoAssetsDist)
        done();
    });
});

// Bundle plotly.js with meta
tasks.push(function(done) {
    _bundle(pathToPlotlyIndex, pathToPlotlyDistWithMeta, {
        noCompressAttributes: true
    }, function() {
        prependFile.sync(pathToPlotlyDistWithMeta, header, common.throwOnError);
        amdWrapper(pathToPlotlyDistWithMeta)
        done();
    });
});

runSeries(tasks, function(err) {
    if(err) throw err;
});
