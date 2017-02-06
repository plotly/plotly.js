var path = require('path');
var fs = require('fs');

var falafel = require('falafel');
var glob = require('glob');
var madge = require('madge');

var constants = require('./util/constants');
var srcGlob = path.join(constants.pathToSrc, '**/*.js');
var libGlob = path.join(constants.pathToLib, '**/*.js');
var testGlob = path.join(constants.pathToJasmineTests, '**/*.js');
var bundleTestGlob = path.join(constants.pathToJasmineBundleTests, '**/*.js');

// main
assertJasmineSuites();
assertSrcContents();
assertFileNames();
assertCircularDeps();


// check for for focus and exclude jasmine blocks
function assertJasmineSuites() {
    var BLACK_LIST = ['fdescribe', 'fit', 'xdescribe', 'xit'];
    var logs = [];

    glob(combineGlobs([testGlob, bundleTestGlob]), function(err, files) {
        files.forEach(function(file) {
            var code = fs.readFileSync(file, 'utf-8');

            falafel(code, {locations: true}, function(node) {
                if(node.type === 'Identifier' && BLACK_LIST.indexOf(node.name) !== -1) {
                    logs.push([
                        path.basename(file),
                        '[line ' + node.loc.start.line + '] :',
                        'contains either a *fdescribe*, *fit*,',
                        '*xdescribe* or *xit* block.'
                    ].join(' '));
                }
            });

        });

        log('no jasmine suites focus/exclude blocks', logs);
    });
}

/*
 * tests about the contents of source (and lib) files:
 * - check for header comment
 * - check that we don't have .classList
 */
function assertSrcContents() {
    var licenseSrc = constants.licenseSrc;
    var licenseStr = licenseSrc.substring(2, licenseSrc.length - 2);
    var logs = [];

    glob(combineGlobs([srcGlob, libGlob]), function(err, files) {
        files.forEach(function(file) {
            var code = fs.readFileSync(file, 'utf-8');

            // parse through code string while keeping track of comments
            var comments = [];
            falafel(code, {onComment: comments, locations: true}, function(node) {
                // look for .classList
                if(node.type === 'MemberExpression') {
                    var parts = node.source().split('.');
                    if(parts[parts.length - 1] === 'classList') {
                        logs.push(file + ' : contains .classList (IE failure)');
                    }
                }
            });

            var header = comments[0];

            if(!header || header.loc.start.line > 1) {
                logs.push(file + ' : has no header information.');
                return;
            }

            if(header.value !== licenseStr) {
                logs.push(file + ' : has incorrect header information.');
            }
        });

        log('correct headers and contents in lib/ and src/', logs);
    });
}

// check that all file names are in lower case
function assertFileNames() {
    var logs = [];

    glob(combineGlobs([srcGlob, libGlob, testGlob, bundleTestGlob]), function(err, files) {
        files.forEach(function(file) {
            var base = path.basename(file);

            if(base !== base.toLowerCase()) {
                logs.push([
                    file, ' :',
                    'has a file name containing some',
                    'non-lower-case characters'
                ]);
            }
        });

        log('lower case only file names', logs);
    });

}

// check circular dependencies
function assertCircularDeps() {
    madge(constants.pathToSrc).then(function(res) {
        var circularDeps = res.circular();
        var logs = [];

        // as of v1.17.0 - 2016/09/08
        // see https://github.com/plotly/plotly.js/milestone/9
        // for more details
        var MAX_ALLOWED_CIRCULAR_DEPS = 17;

        if(circularDeps.length > MAX_ALLOWED_CIRCULAR_DEPS) {
            logs.push('some new circular dependencies were added to src/');
        }

        log('circular dependencies', logs);
    });
}

function combineGlobs(arr) {
    return '{' + arr.join(',') + '}';
}

function log(name, logs) {
    if(logs.length) {
        console.error('test-syntax error [' + name + ']\n');
        throw new Error('\n' + logs.join('\n') + '\n');
    }

    console.log('ok ' + name);
}
