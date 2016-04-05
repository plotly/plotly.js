var path = require('path');
var fs = require('fs');

var falafel = require('falafel');
var glob = require('glob');

var constants = require('../tasks/util/constants');

var srcGlob = path.join(constants.pathToSrc, '**/*.js');
var libGlob = path.join(constants.pathToLib, '**/*.js');
var testGlob = path.join(constants.pathToJasmineTests, '**/*.js');
var bundleTestGlob = path.join(constants.pathToJasmineBundleTests, '**/*.js');

// main
assertJasmineSuites();
assertHeaders();
assertFileNames();


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

        log(logs);
    });
}

// check for header in src and lib files
function assertHeaders() {
    var licenseSrc = constants.licenseSrc;
    var licenseStr = licenseSrc.substring(2, licenseSrc.length - 2);
    var logs = [];

    glob(combineGlobs([srcGlob, libGlob]), function(err, files) {
        files.forEach(function(file) {
            var code = fs.readFileSync(file, 'utf-8');

            // parse through code string while keeping track of comments
            var comments = [];
            falafel(code, {onComment: comments, locations: true}, function() {});

            var header = comments[0];

            if(!header || header.loc.start.line > 1) {
                logs.push(file + ' : has no header information.');
                return;
            }

            if(header.value !== licenseStr) {
                logs.push(file + ' : has incorrect header information.');
            }
        });

        log(logs);
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

        log(logs);
    });

}

function combineGlobs(arr) {
    return '{' + arr.join(',') + '}';
}

function log(logs) {
    if(logs.length) {
        throw new Error('\n' + logs.join('\n') + '\n');
    }
}
