var prependFile = require('prepend-file');

var constants = require('./util/constants');
var common = require('./util/common');
var _bundle = require('./util/browserify_wrapper');

var header = constants.licenseDist + '\n';
var allTransforms = constants.allTransforms;
var allTraces = constants.allTraces;
var mainIndex = constants.mainIndex;
var excludedTraces = constants.excludedTraces;

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

    tasks.push(function(done) {
        var partialIndex = mainIndex;

        var all = ['calendars'].concat(allTransforms).concat(allTraces);
        var includes = (calendars ? ['calendars'] : []).concat(transformList).concat(traceList);
        var excludes = all.filter(function(e) { return includes.indexOf(e) === -1 && excludedTraces.indexOf(e) === -1; });
        var missing = includes.filter(function(e) { return excludedTraces.indexOf(e) !== -1; });

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

        missing.forEach(function(t) {
            // find 'Plotly.register([' and add require('./<trace>')
            var REGEX_BEFORE = new RegExp(
                'Plotly\\.register\\(\\[\\n',
            'g');
            partialIndex = partialIndex.replace(
                REGEX_BEFORE,
                'Plotly.register([\n' +
                '    require(\'./' + t + '\'),\n'
            );
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
};
