var minimist = require('minimist');
var runSeries = require('run-series');

var partialBundle = require('./partial_bundle');
var constants = require('./util/constants');
var partialBundlePaths = constants.partialBundleNames.map(constants.makePartialBundleOpts);

var list = partialBundlePaths;

if(process.argv.length > 2) {
    // command line

    var args = minimist(process.argv.slice(2), {});
    var names = args._;
    list = [];
    for(var k = 0; k < names.length; k++) {
        for(var q = 0; q < partialBundlePaths.length; q++) {
            var p = partialBundlePaths[q];
            if(partialBundlePaths[q].name === names[k]) {
                list.push(p);
                break;
            }
        }
    }
}

var tasks = [];

// Bundle the plotly.js partial bundles
for(var i = 0; i < list.length; i++) {
    var opts = list[i];

    // strict bundle is no longer a partial bundle and generated with bundles
    if(opts.name === 'strict') continue;

    partialBundle(tasks, {
        name: opts.name,
        index: opts.index,
        dist: opts.dist,
        distMin: opts.distMin,
        traceList: opts.traceList,
        transformList: opts.transformList,
        calendars: opts.calendars
    });
}

runSeries(tasks, function(err) {
    if(err) throw err;
});
