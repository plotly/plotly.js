var path = require('path');
var minimist = require('minimist');
var runSeries = require('run-series');

var partialBundle = require('./partial_bundle');
var constants = require('./util/constants');

var allTransforms = constants.allTransforms;
var allTraces = constants.allTraces;

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
    var strict = inputBoolean(args.strict, false);

    var opts = {
        traceList: createList(['scatter'], traces, allTraces, 'trace'),
        transformList: createList([], transforms, allTransforms, 'transform'),

        name: out,
        index: path.join(constants.pathToLib, 'index-' + (strict ? 'strict-' : '') + out + '.js'),
        strict: strict,
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
