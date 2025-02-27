import prependFile from 'prepend-file';

import constants from './util/constants.js';
import common from './util/common.js';
import _bundle from './util/bundle_wrapper.mjs';

var header = constants.licenseDist + '\n';
var allTraces = constants.allTraces;
var mainIndex = constants.mainIndex;
var strictIndex = constants.strictIndex;

// Bundle the plotly.js partial bundles
export default function partialBundle(tasks, opts) {
    var name = opts.name;
    var index = opts.index;
    var deleteIndex = opts.deleteIndex;
    var dist = opts.dist;
    var distMin = opts.distMin;
    var traceList = opts.traceList;
    var calendars = opts.calendars;
    var strict = opts.strict;

    // skip strict bundle which is no longer a partial bundle and has a special index file for regl traces
    if(name !== 'strict') {
        tasks.push(function(done) {
            var partialIndex = (strict) ? strictIndex : mainIndex;

            var all = ['calendars'].concat(allTraces);
            var includes = (calendars ? ['calendars'] : []).concat(traceList);
            var excludes = all.filter(function(e) { return includes.indexOf(e) === -1; });

            excludes.forEach(function(t) {
                var WHITESPACE_BEFORE = '\\s*';
                // remove require
                var regEx = WHITESPACE_BEFORE + 'require\\(\'\\./' + t + '\'\\),';
                if(strict) {
                    regEx += '|require\\(\'\\.\\./src/traces/' + t + '/strict\'\\),';
                }
                var newCode = partialIndex.replace(new RegExp(regEx, 'g'), '');

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
            deleteIndex: deleteIndex && !distMin,
        };

        _bundle(index, dist, bundleOpts, function() {
            var headerDist = header.replace('plotly.js', 'plotly.js (' + name + ')');

            if(dist) prependFile.sync(dist, headerDist, common.throwOnError);

            done();
        });
    });

    tasks.push(function(done) {
        var bundleOpts = {
            deleteIndex: deleteIndex,
            minify: true,
        };

        _bundle(index, distMin, bundleOpts, function() {
            var headerDistMin = header.replace('plotly.js', 'plotly.js (' + name + ' - minified)');

            if(distMin) prependFile.sync(distMin, headerDistMin, common.throwOnError);

            done();
        });
    });
}
