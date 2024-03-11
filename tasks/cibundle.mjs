import runSeries from 'run-series';
import constants from './util/constants.js';
import _bundle from './util/bundle_wrapper.mjs';

/*
 * Trimmed down version of ./bundle.js for CI testing
 *
 * Outputs:
 *
 *  - plotly.js bundle in build/
 *  - plotly-geo-assets.js bundle in build/ (in accordance with test/image/index.html)
 *  - plotly.min.js bundle in build/ (for minified_bundle test)
 */

// list of tasks to pass to run-series to not blow up
// memory consumption.
var tasks = [];

// Bundle plotly.js
tasks.push(function(done) {
    _bundle(constants.pathToPlotlyIndex, constants.pathToPlotlyBuild, {
        noCompressAttributes: true,
    }, done)
});

// Bundle plotly.min.js
tasks.push(function(done) {
    _bundle(constants.pathToPlotlyIndex, constants.pathToPlotlyBuildMin, {
        minify: true,
        noCompressAttributes: true,
    }, done)
});

// Bundle the geo assets
tasks.push(function(done) {
    _bundle(constants.pathToPlotlyGeoAssetsSrc, constants.pathToPlotlyGeoAssetsDist, {
        noPlugins: true,
        standalone: 'PlotlyGeoAssets'
    }, done)
});

runSeries(tasks, function(err) {
    if(err) throw err;
});
