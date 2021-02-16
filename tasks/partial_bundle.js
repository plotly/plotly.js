var fs = require('fs');
var path = require('path');
var runSeries = require('run-series');
var prependFile = require('prepend-file');

var constants = require('./util/constants');
var common = require('./util/common');
var _bundle = require('./util/browserify_wrapper');

var header = constants.licenseDist + '\n';

var tasks = [];
var allTraces = fs.readdirSync(path.join(constants.pathToSrc, 'traces'));
var fullIndex = fs.readFileSync(constants.pathToPlotlyIndex, 'utf-8');

// Browserify the plotly.js partial bundles
constants.partialBundlePaths.forEach(function(pathObj) {
    tasks.push(function(done) {
        var traceList = constants.partialBundleTraces[pathObj.name];

        var partialIndex = fullIndex;
        allTraces.forEach(function(trace) {
            if(traceList.indexOf(trace) === -1) {
                var WHITESPACE_BEFORE = '\\s*';
                // remove require
                var newCode = partialIndex.replace(
                    new RegExp(
                        WHITESPACE_BEFORE +
                        'require\\(\'\\.\\./src/traces/' + trace + '\'\\),',
                    'g'), ''
                );

                // test removal
                if(newCode === partialIndex) throw 'Unable to find and drop require for trace: "' + trace + '"';

                partialIndex = newCode;
            }
        });

        common.writeFile(pathObj.index, partialIndex, done);
    });

    tasks.push(function(done) {
        _bundle(pathObj.index, pathObj.dist, {
            standalone: 'Plotly',
            pathToMinBundle: pathObj.distMin
        }, function() {
            var headerDist = header.replace('plotly.js', 'plotly.js (' + pathObj.name + ')');
            var headerDistMin = header.replace('plotly.js', 'plotly.js (' + pathObj.name + ' - minified)');

            prependFile(pathObj.dist, headerDist, common.throwOnError);
            prependFile(pathObj.distMin, headerDistMin, common.throwOnError);

            done();
        });
    });
});

runSeries(tasks, function(err) {
    if(err) throw err;
});
