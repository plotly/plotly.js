var path = require('path');
var minimist = require('minimist');
var runSeries = require('run-series');
var prependFile = require('prepend-file');

var constants = require('./util/constants');
var common = require('./util/common');
var _bundle = require('./util/browserify_wrapper');

var header = constants.licenseDist + '\n';
var allTransforms = constants.allTransforms;
var allTraces = constants.allTraces;
var mainIndex = constants.mainIndex;

function isFalse(a) {
    return (
        a === 'none' ||
        a === 'false'
    );
}

function inputArray(a, dflt) {
    dflt = dflt.slice();

    return (
        isFalse(a) ? [] :
            !a || a === 'all' ? dflt :
                a.split(',')
    );
}

if(process.argv.length > 2) {
    // command line

    var args = minimist(process.argv.slice(2), {});

    // parse arguments
    var out = args.out ? args.out : 'custom';
    var traces = inputArray(args.traces, allTraces);
    var transforms = inputArray(args.transforms, allTransforms);

    var i, t;

    var traceList = ['scatter']; // added by default
    for(i = 0; i < traces.length; i++) {
        t = traces[i];
        if(
            traceList.indexOf(t) === -1 // not added before
        ) {
            if(allTraces.indexOf(t) === -1) {
                console.error(t, 'is not a valid trace!', 'Valid traces are:', allTraces);
            } else {
                traceList.push(t);
            }
        }
    }
    traceList = traceList.sort();

    var transformList = [];
    for(i = 0; i < transforms.length; i++) {
        t = transforms[i];
        if(
            transformList.indexOf(t) === -1 // not added before
        ) {
            if(allTransforms.indexOf(t) === -1) {
                console.error(t, 'is not a valid transform!', 'Valid transforms are:', allTransforms);
            } else {
                transformList.push(t);
            }
        }
    }
    transformList = transformList.sort();

    var opts = {
        traceList: traceList,
        transformList: transformList,

        name: out,
        index: path.join(constants.pathToLib, 'index-' + out + '.js'),
        dist: path.join(constants.pathToDist, 'plotly-' + out + '.js'),
        distMin: path.join(constants.pathToDist, 'plotly-' + out + '.min.js')
    };

    console.log(opts);

    opts.sourcemap = true;
    opts.calendars = true;

    var tasks = [];

    partialBundle(tasks, opts);

    runSeries(tasks, function(err) {
        if(err) throw err;
    });
}

// Browserify the plotly.js partial bundles
function partialBundle(tasks, opts) {
    var name = opts.name;
    var index = opts.index;
    var dist = opts.dist;
    var distMin = opts.distMin;
    var traceList = opts.traceList;
    var transformList = opts.transformList;
    var calendars = opts.calendars;
    var sourcemap = opts.sourcemap;

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
                    'require\\(\'\\./' + t + '\'\\)' +
                    (t === 'calendars' ? '' : ','), // there is no comma after calendars require
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

    tasks.push(function(done) {
        var bundleOpts = {
            debug: sourcemap,
            standalone: 'Plotly',
            pathToMinBundle: distMin
        };

        _bundle(index, dist, bundleOpts, function() {
            var headerDist = header.replace('plotly.js', 'plotly.js (' + name + ')');
            var headerDistMin = header.replace('plotly.js', 'plotly.js (' + name + ' - minified)');

            if(dist) prependFile(dist, headerDist, common.throwOnError);
            if(distMin) prependFile(distMin, headerDistMin, common.throwOnError);

            done();
        });
    });
}

module.exports = partialBundle;
