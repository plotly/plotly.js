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

function createList(outList, inList, allList, type) {
    for(var i = 0; i < inList.length; i++) {
        var t = inList[i];
        if(
            outList.indexOf(t) === -1 // not added before
        ) {
            if(allList.indexOf(t) === -1) {
                console.error(t, 'is not a valid ' + type + '!', 'Valid ' + type + 's are:', allList);
            } else {
                outList.push(t);
            }
        }
    }

    return outList.sort();
}

function isFalse(a) {
    return (
        a === 'none' ||
        a === 'false'
    );
}

function inputBoolean(a, dflt) {
    return !a ? dflt : !isFalse(a);
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
    var unminified = inputBoolean(args.unminified, false);
    var out = args.out ? args.out : 'custom';
    var traces = inputArray(args.traces, allTraces);
    var transforms = inputArray(args.transforms, allTransforms);

    var opts = {
        traceList: createList([], traces, allTraces, 'trace'),
        transformList: createList([], transforms, allTransforms, 'transform'),

        name: out,
        index: path.join(constants.pathToLib, 'index-' + out + '.js')
    };

    if(unminified) {
        opts.dist = path.join(constants.pathToDist, 'plotly-' + out + '.js');
    } else {
        opts.distMin = path.join(constants.pathToDist, 'plotly-' + out + '.min.js');
    }

    console.log(opts);

    opts.calendars = true;
    opts.deleteIndex = true;

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
    var deleteIndex = opts.deleteIndex;
    var dist = opts.dist;
    var distMin = opts.distMin;
    var traceList = opts.traceList;
    var transformList = opts.transformList;
    var calendars = opts.calendars;

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

    tasks.push(function(done) {
        var bundleOpts = {
            standalone: 'Plotly',
            deleteIndex: deleteIndex,
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
