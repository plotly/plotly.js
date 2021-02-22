var runSeries = require('run-series');

var partialBundle = require('./partial_bundle');
var constants = require('./util/constants');
var partialBundlePaths = constants.partialBundleNames.map(constants.makePartialBundleOpts);

var tasks = [];

// Browserify the plotly.js partial bundles
for(var i = 0; i < partialBundlePaths.length; i++) {
    var opts = partialBundlePaths[i];

    partialBundle(tasks, {
        name: opts.name,
        index: opts.index,
        dist: opts.dist,
        distMin: opts.distMin,
        traceList: opts.traceList
    });
}

runSeries(tasks, function(err) {
    if(err) throw err;
});
