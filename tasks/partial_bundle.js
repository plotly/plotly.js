var path = require('path');
var runSeries = require('run-series');
var prependFile = require('prepend-file');

var constants = require('./util/constants');
var common = require('./util/common');
var _bundle = require('./util/browserify_wrapper');

var header = constants.licenseDist + '\n';
var allTraces = constants.allTraces;
var mainIndex = constants.mainIndex;

var argv = process.argv;

if(argv.length > 2) {
    // command line

    var traceList = ['scatter']; // added by default
    var name;
    for(var i = 2; i < argv.length; i++) {
        var a = argv[i];

        if(
            allTraces.indexOf(a) !== -1 && // requested
            traceList.indexOf(a) === -1    // not added before
        ) {
            traceList.push(a);
        }
        if(a.indexOf('--name=') === 0) name = a.replace('--name=', '');
    }
    if(!name) name = 'custom';
    traceList = traceList.sort();

    var opts = {
        traceList: traceList,
        name: name,

        index: path.join(constants.pathToBuild, 'index-' + name + '.js'),
        dist: path.join(constants.pathToDist, 'plotly-' + name + '.js'),
        distMin: path.join(constants.pathToDist, 'plotly-' + name + '.min.js')
    };

    console.log(opts);

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

    tasks.push(function(done) {
        var partialIndex = mainIndex;
        allTraces.forEach(function(trace) {
            if(traceList.indexOf(trace) === -1) {
                var WHITESPACE_BEFORE = '\\s*';
                // remove require
                var newCode = partialIndex.replace(
                    new RegExp(
                        WHITESPACE_BEFORE +
                        'require\\(\'\\./' + trace + '\'\\),',
                    'g'), ''
                );

                // test removal
                if(newCode === partialIndex) throw 'Unable to find and drop require for trace: "' + trace + '"';

                partialIndex = newCode;
            }
        });

        common.writeFile(index, partialIndex, done);
    });

    tasks.push(function(done) {
        _bundle(index, dist, {
            standalone: 'Plotly',
            pathToMinBundle: distMin
        }, function() {
            var headerDist = header.replace('plotly.js', 'plotly.js (' + name + ')');
            var headerDistMin = header.replace('plotly.js', 'plotly.js (' + name + ' - minified)');

            prependFile(dist, headerDist, common.throwOnError);
            prependFile(distMin, headerDistMin, common.throwOnError);

            done();
        });
    });
}

module.exports = partialBundle;
