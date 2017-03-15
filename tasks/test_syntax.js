var path = require('path');
var fs = require('fs');

var falafel = require('falafel');
var glob = require('glob');
var madge = require('madge');
var readLastLines = require('read-last-lines');

var constants = require('./util/constants');
var srcGlob = path.join(constants.pathToSrc, '**/*.js');
var libGlob = path.join(constants.pathToLib, '**/*.js');
var testGlob = path.join(constants.pathToJasmineTests, '**/*.js');
var bundleTestGlob = path.join(constants.pathToJasmineBundleTests, '**/*.js');

var EXIT_CODE = 0;

// main
assertJasmineSuites();
assertSrcContents();
assertFileNames();
assertTrailingNewLine();
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
    var pattern = combineGlobs([
        path.join(constants.pathToRoot, '*.*'),
        path.join(constants.pathToSrc, '**/*.*'),
        path.join(constants.pathToLib, '**/*.*'),
        path.join(constants.pathToDist, '**/*.*'),
        path.join(constants.pathToRoot, 'test', '**/*.*'),
        path.join(constants.pathToRoot, 'tasks', '**/*.*'),
        path.join(constants.pathToRoot, 'devtools', '**/*.*')
    ]);

    var logs = [];

    glob(pattern, function(err, files) {
        files.forEach(function(file) {
            var base = path.basename(file);

            if(
                base === 'README.md' ||
                base === 'CONTRIBUTING.md' ||
                base === 'CHANGELOG.md' ||
                base === 'SECURITY.md' ||
                file.indexOf('mathjax') !== -1
            ) return;

            if(base !== base.toLowerCase()) {
                logs.push([
                    file, ':',
                    'has a file name containing some',
                    'non-lower-case characters'
                ].join(' '));
            }
        });

        log('lower case only file names', logs);
    });
}

// check that all files have a trailing new line character
function assertTrailingNewLine() {
    var pattern = combineGlobs([
        path.join(constants.pathToSrc, '**/*.glsl'),
        path.join(constants.pathToRoot, 'test', 'image', 'mocks', '*')
    ]);

    var regexNewLine = /\r?\n$/;
    var regexEmptyNewLine = /^\r?\n$/;
    var promises = [];
    var logs = [];

    glob(pattern, function(err, files) {
        files.forEach(function(file) {
            var promise = readLastLines.read(file, 1);

            promises.push(promise);

            promise.then(function(lines) {
                if(!regexNewLine.test(lines)) {
                    logs.push([
                        file, ':',
                        'does not have a trailing new line character'
                    ].join(' '));
                } else if(regexEmptyNewLine.test(lines)) {
                    logs.push([
                        file, ':',
                        'has more than one trailing new line'
                    ].join(' '));
                }
            });
        });

        Promise.all(promises).then(function() {
            log('trailing new line character', logs);
        });
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
            console.log(circularDeps.join('\n'));
            logs.push('some new circular dependencies were added to src/');
        }

        log('circular dependencies: ' + circularDeps.length, logs);
    });
}

function combineGlobs(arr) {
    return '{' + arr.join(',') + '}';
}

function log(name, logs) {
    if(logs.length) {
        console.error('test-syntax error [' + name + ']');
        console.error(logs.join('\n'));
        EXIT_CODE = 1;
    } else {
        console.log('ok ' + name);
    }
}

process.on('exit', function() {
    if(EXIT_CODE) {
        throw new Error('test syntax failed.');
    }
});
