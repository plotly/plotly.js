var prependFile = require('prepend-file');

var constants = require('./util/constants');
var common = require('./util/common');
var _bundle = require('./util/browserify_wrapper');

var header = constants.licenseDist + '\n';
var allTransforms = constants.allTransforms;
var allTraces = constants.allTraces;
var mainIndex = constants.mainIndex;

// Browserify the plotly.js partial bundles
module.exports = function partialBundle(tasks, opts) {
    var name = opts.name;
    var index = opts.index;
    var deleteIndex = opts.deleteIndex;
    var dist = opts.dist;
    var distMin = opts.distMin;
    var traceList = opts.traceList;
    var transformList = opts.transformList;
    var calendars = opts.calendars;

    // skip strict bundle which is no longer a partial bundle and has a special index file for regl traces
    if(name !== 'strict') {
        tasks.push(function(done) {
            var partialIndex = mainIndex;

            var all = ['calendars'].concat(allTransforms).concat(allTraces);
            var includes = (calendars ? ['calendars'] : []).concat(transformList).concat(traceList);
            var excludes = all.filter(function(e) { return includes.indexOf(e) === -1; });

            excludes.forEach(function(t) {
                var WHITESPACE_BEFORE = '\\s*';
                // remove require
                var newCode = partialIndex.replace(
                    new RegExp(
                        WHITESPACE_BEFORE +
                        'require\\(\'\\./' + t + '\'\\),',
                    'g'), ''
                );

                // test removal
                if(newCode === partialIndex) {
                    console.error('Unable to find and drop require for ' + t);
                    throw 'Error generating index for partial bundle!';
                }

                partialIndex = newCode;
            });

            common.writeFile(index, partialIndex, done);
        });
    }

    tasks.push(function(done) {
        var bundleOpts = {
            standalone: 'Plotly',
            deleteIndex: deleteIndex,
            pathToMinBundle: distMin
        };

        _bundle(index, dist, bundleOpts, function() {
            var headerDist = header.replace('plotly.js', 'plotly.js (' + name + ')');
            var headerDistMin = header.replace('plotly.js', 'plotly.js (' + name + ' - minified)');

            if(dist) prependFile.sync(dist, headerDist, common.throwOnError);
            if(distMin) prependFile.sync(distMin, headerDistMin, common.throwOnError);

            done();
        });
    });
};
